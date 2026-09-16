import { hashString } from "@/lib/generation/timing";
import {
  availableAspects,
  getSamples,
  nearestAspect,
  type Aspect,
  type Sample,
  type SampleKind,
} from "@/lib/samples";

/**
 * Which stock sample a "generation" comes back with.
 *
 * One implementation for both kinds: video asks for one id, image asks for
 * `count` distinct ones. The rule is the same - score the library against the
 * prompt, shortlist the best, then pick deterministically from a hash of
 * prompt + seed. Same prompt, same clip; Regenerate passes a new seed and gets
 * a different one.
 */

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "in", "on", "at", "to", "for", "with",
  "from", "by", "as", "is", "are", "was", "be", "it", "its", "this", "that",
  "into", "over", "under", "up", "down", "out", "very", "shot", "video",
  "image", "photo", "camera", "scene", "clip",
]);

/**
 * Crude stemming - just enough that "waves" matches "wave" and "dunes" matches
 * "dune". Applied to both sides, so it only ever has to be self-consistent.
 * The 4-character floor stops it chewing short words down to noise.
 */
function stem(word: string): string {
  const trimmed = word.replace(/(ing|es|s)$/, "");
  return trimmed.length >= 4 ? trimmed : word;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .map(stem);
}

/**
 * Word counts as a hit if it matches exactly, or if one side is a prefix of
 * the other with at least four characters shared.
 *
 * The prefix rule is there because the stemmer only trims `ing|es|s`, so
 * "dancing" becomes "danc" while "dance" and "dancer" stay as they are and the
 * three never meet. That is not academic: "woman dancing under a red light"
 * scored the dancer clip exactly as high as a night-time car interior, because
 * the only word either of them matched was "light".
 *
 * The four-character floor keeps it honest - "car" and "cat" can't collide.
 */
function matches(word: string, haystack: Set<string>): boolean {
  if (haystack.has(word)) return true;
  if (word.length < 4) return false;

  for (const candidate of haystack) {
    if (candidate.length < 4) continue;
    if (candidate.startsWith(word) || word.startsWith(candidate)) return true;
  }
  return false;
}

/** Every word a sample can be found by. Static data, so worth keeping. */
const haystacks = new Map<string, Set<string>>();

function haystackFor(sample: Sample): Set<string> {
  let words = haystacks.get(sample.id);
  if (!words) {
    words = new Set([
      ...sample.tags.flatMap((tag) => tokenize(tag)),
      ...tokenize(sample.prompt),
      ...tokenize(sample.category),
    ]);
    haystacks.set(sample.id, words);
  }
  return words;
}

/**
 * Matched words, counted flat.
 *
 * Weighting them by rarity was tried and reverted. It reads well in theory -
 * "dancing" is in one clip, "light" is in a third of the library - but a prompt's
 * rarest words are usually its *style*, not its subject, and the style then
 * outvotes the subject. "drone flying over snowy mountain ridges at golden hour"
 * started returning the desert clip, because "golden" and "hour" are rarer than
 * "drone" and "mountain". Flat counting gets the subject right, which matters
 * more.
 */
function score(sample: Sample, wanted: Set<string>): number {
  if (wanted.size === 0) return 0;
  const haystack = haystackFor(sample);
  let hits = 0;
  for (const word of wanted) if (matches(word, haystack)) hits += 1;
  return hits;
}

export function pickSampleIds({
  kind,
  aspect,
  prompt,
  seed,
  count = 1,
}: {
  kind: SampleKind;
  aspect: Aspect;
  prompt: string;
  seed?: number;
  count?: number;
}): string[] {
  const pool = getSamples(kind);
  if (pool.length === 0) return [];

  // The aspect the library can actually serve - a few of them have no samples
  // of a given kind at all.
  const preferred = nearestAspect(aspect, availableAspects(kind)) ?? aspect;

  const wanted = new Set(tokenize(prompt));

  /**
   * Aspect is a tiebreaker, not a filter.
   *
   * It used to be a filter, and that was the single biggest reason results
   * didn't match the prompt: "woman dancing under a red light" at 16:9 came
   * back as a car interior, because the dancer clip is 9:16 and was never even
   * a candidate. There are only ten videos per aspect - narrow enough that
   * plenty of prompts have no good answer inside the one you picked.
   *
   * Sorting on score first and aspect second means a like-for-like match in the
   * requested aspect still wins, but a better match from another aspect wins
   * outright. Those render object-cover inside the requested aspect box, so the
   * result is still the shape that was asked for.
   */
  const scored = pool
    .map((sample) => ({
      sample,
      value: score(sample, wanted),
      inAspect: sample.aspect === preferred,
    }))
    // Ties broken by id so the order is stable across server instances.
    .sort(
      (a, b) =>
        b.value - a.value ||
        Number(b.inAspect) - Number(a.inAspect) ||
        a.sample.id.localeCompare(b.sample.id),
    );

  const matching = scored.filter((entry) => entry.value > 0);

  /**
   * A sample that shares no words with the prompt never competes with one that
   * does. Keeping them in "the top 3" was how "waves crashing on a rocky coast"
   * came back with a night-time car interior - the coast clip scored 1, the
   * other two scored 0, and a flat pick gave them equal odds.
   *
   * Zero-scorers only come back in to fill an image grid that would otherwise
   * be short, and they sort behind everything that did match. The aspect
   * tiebreak still applies to them, so filler stays in the shape that was asked
   * for.
   *
   * No word overlap anywhere: fall back to the whole pool rather than pretending
   * the arbitrary top of a list of zeroes is a match. The tiebreak still leads
   * with the requested aspect.
   */
  /**
   * Everything, best first: what matched in score order, then the rest.
   *
   * The non-matching tail used to be dropped unless a grid would be short. It
   * stays now because it's what Regenerate rotates into once the handful of
   * real matches runs out - see below.
   */
  const ranked =
    matching.length > 0
      ? [...matching, ...scored.filter((entry) => entry.value === 0)]
      : scored;

  /**
   * Where in the ranked list this result starts.
   *
   * The hash breaks ties; it doesn't overrule the score. A flat
   * `hash % length` across the whole list gave every entry an equal shot, and
   * it showed: "ocean waves in slow motion" came back as ink-in-water with an
   * ocean clip scoring twice as well right above it. So the lead is drawn only
   * from the samples tied at the best score, and the same prompt with no seed
   * always gives the same result.
   */
  const hash = hashString(`${prompt.trim().toLowerCase()}|0`);
  const best = ranked[0];
  const tied = ranked.filter(
    (entry) => entry.value === best.value && entry.inAspect === best.inAspect,
  ).length;
  const baseLead = hash % tied;

  /**
   * Regenerate turns the page, by a whole page.
   *
   * This used to hash `prompt|seed` and take `% tied`, so a prompt with one
   * clear best match had `tied === 1`, the seed changed nothing, and "a
   * mountain lake at dawn" regenerated to the same four images every time. A
   * dead button.
   *
   * The seed is a step count now (Regenerate increments it) and it's an offset
   * from the first run's lead, not an independent draw - drawing independently
   * meant step 1 could land back on the result you already had. Stepping by
   * `count` rather than by 1 means a grid of four comes back as four new
   * images rather than the same three plus one.
   *
   * Results stay on prompt because the list is ordered by relevance: these are
   * the next best matches, not random ones.
   */
  const lead =
    seed === undefined
      ? baseLead
      : (baseLead + seed * Math.max(1, count)) % ranked.length;

  // Then take the rest in order from there, so a grid gets the next-best
  // matches and every id is distinct by construction.
  const picked: string[] = [];
  for (let i = 0; i < Math.min(count, ranked.length); i += 1) {
    picked.push(ranked[(lead + i) % ranked.length].sample.id);
  }
  return picked;
}

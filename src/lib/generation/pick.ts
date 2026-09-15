import { hashString } from "@/lib/generation/timing";
import {
  availableAspects,
  getSamples,
  nearestAspect,
  samplesByAspect,
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

function score(sample: Sample, wanted: Set<string>): number {
  if (wanted.size === 0) return 0;
  const haystack = new Set([
    ...sample.tags.flatMap((tag) => tokenize(tag)),
    ...tokenize(sample.prompt),
    ...tokenize(sample.category),
  ]);
  let hits = 0;
  for (const word of wanted) if (haystack.has(word)) hits += 1;
  return hits;
}

/**
 * Candidates in the requested aspect, topped up from the nearest aspects when
 * there aren't enough (only images ask for more than one, and a few aspects
 * only have three samples). The caller renders the extras object-cover inside
 * the requested aspect box so the grid still looks right.
 */
function candidates(kind: SampleKind, aspect: Aspect, need: number): Sample[] {
  const available = availableAspects(kind);
  const best = nearestAspect(aspect, available) ?? aspect;
  const pool = samplesByAspect(kind, best);
  if (pool.length >= need) return pool;

  const rest = getSamples(kind).filter((sample) => sample.aspect !== best);
  const byCloseness = [...rest].sort((a, b) => {
    const order = [a, b].map(
      (sample) => (nearestAspect(aspect, [sample.aspect, best]) === sample.aspect ? 0 : 1),
    );
    return order[0] - order[1];
  });
  return [...pool, ...byCloseness];
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
  const pool = candidates(kind, aspect, count);
  if (pool.length === 0) return [];

  const wanted = new Set(tokenize(prompt));
  const scored = pool
    .map((sample) => ({ sample, value: score(sample, wanted) }))
    // Ties broken by id so the order is stable across server instances.
    .sort((a, b) => b.value - a.value || a.sample.id.localeCompare(b.sample.id));

  // No word overlap at all: fall back to the whole pool rather than pretending
  // the arbitrary top of a list of zeroes is a match.
  const hasOverlap = scored[0].value > 0;

  /**
   * A sample that shares no words with the prompt never competes with one that
   * does. Keeping them in "the top 3" was how "waves crashing on a rocky coast"
   * came back with a night-time car interior - the coast clip scored 1, the
   * other two scored 0, and a flat pick gave them equal odds.
   *
   * Zero-scorers only come back in to fill an image grid that would otherwise
   * be short, and they sort behind everything that did match.
   */
  let shortlist = scored;
  if (hasOverlap) {
    const matching = scored.filter((entry) => entry.value > 0);
    const capped = matching.slice(0, Math.max(3, count * 2));
    shortlist =
      capped.length >= count
        ? capped
        : [...capped, ...scored.filter((entry) => entry.value === 0)].slice(0, count);
  }

  const hash = hashString(`${prompt.trim().toLowerCase()}|${seed ?? 0}`);

  /**
   * The hash breaks ties; it doesn't overrule the score.
   *
   * A flat `hash % length` across the whole shortlist gave every entry an equal
   * shot, and it showed: "ocean waves in slow motion" came back as ink-in-water
   * with an ocean clip scoring twice as well right above it. So the lead is
   * drawn only from the samples tied at the best score.
   *
   * Regenerate still moves whenever there's a tie at the top - which is most
   * prompts, on a library this size - and when there's one clear best match,
   * returning it every time is the right answer rather than a missing feature.
   */
  const best = shortlist[0].value;
  const tied = shortlist.filter((entry) => entry.value === best).length;
  const lead = hash % tied;

  // Then take the rest in score order from there, so a grid gets the next-best
  // matches and every id is distinct by construction.
  const picked: string[] = [];
  for (let i = 0; i < Math.min(count, shortlist.length); i += 1) {
    picked.push(shortlist[(lead + i) % shortlist.length].sample.id);
  }
  return picked;
}

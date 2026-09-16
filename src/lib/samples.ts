import manifest from "@/data/samples.json";

export type Aspect = "16:9" | "9:16" | "1:1" | "4:5" | "3:4";
export type SampleKind = "video" | "image";
export type SampleCategory =
  | "cinematic"
  | "people"
  | "nature"
  | "product"
  | "abstract"
  | "motion";

export type SampleCredit = {
  author: string;
  /**
   * Pexels only. Spec 02 planned for Mixkit too and it was dropped to save
   * time; the union kept `"Mixkit"` in case it came back. It didn't, and a
   * source the credits page can never show is just a wrong type.
   */
  source: "Pexels";
  /** The item's page, never the file URL. */
  sourceUrl: string;
  license: string;
  licenseUrl: string;
};

export type Sample = {
  id: string;
  kind: SampleKind;
  src: string;
  /** Videos only. */
  poster?: string;
  width: number;
  height: number;
  aspect: Aspect;
  /** Videos only. */
  durationSec?: number;
  /**
   * A prompt *we* wrote that describes the clip. The clip was NOT generated
   * from it - these are stock files. Always surfaced in the UI as
   * "Prompt idea", never "Prompt".
   */
  prompt: string;
  tags: string[];
  category: SampleCategory;
  credit: SampleCredit;
};

/** Exact pixel dimensions each aspect is cropped to. Shared with the scripts. */
export const ASPECT_DIMENSIONS: Record<
  Aspect,
  { video?: { width: number; height: number }; image: { width: number; height: number } }
> = {
  "16:9": { video: { width: 1280, height: 720 }, image: { width: 1440, height: 810 } },
  "9:16": { video: { width: 720, height: 1280 }, image: { width: 810, height: 1440 } },
  "1:1": { video: { width: 720, height: 720 }, image: { width: 1200, height: 1200 } },
  "4:5": { image: { width: 1152, height: 1440 } },
  "3:4": { image: { width: 1080, height: 1440 } },
};

const ASPECT_RATIOS: Record<Aspect, number> = {
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "1:1": 1,
  "4:5": 4 / 5,
  "3:4": 3 / 4,
};

const samples = manifest as Sample[];

export function getSamples(kind?: SampleKind): Sample[] {
  return kind ? samples.filter((sample) => sample.kind === kind) : samples;
}

export function getSample(id: string): Sample | undefined {
  return samples.find((sample) => sample.id === id);
}

export function samplesByAspect(kind: SampleKind, aspect: Aspect): Sample[] {
  return samples.filter(
    (sample) => sample.kind === kind && sample.aspect === aspect,
  );
}

/**
 * Closest available aspect by ratio, for when the requested one has no samples.
 * Returns undefined only if `available` is empty.
 */
export function nearestAspect(
  aspect: Aspect,
  available: Aspect[],
): Aspect | undefined {
  if (available.length === 0) return undefined;
  if (available.includes(aspect)) return aspect;

  const target = ASPECT_RATIOS[aspect];
  return available.reduce((best, candidate) =>
    Math.abs(ASPECT_RATIOS[candidate] - target) <
    Math.abs(ASPECT_RATIOS[best] - target)
      ? candidate
      : best,
  );
}

/** Aspects that actually have at least one sample of this kind. */
export function availableAspects(kind: SampleKind): Aspect[] {
  return [...new Set(getSamples(kind).map((sample) => sample.aspect))];
}

export function creditLine(sample: Sample): string {
  const noun = sample.kind === "video" ? "Video" : "Photo";
  return `${noun} by ${sample.credit.author} on ${sample.credit.source}`;
}

/**
 * Samples that read as bright and punchy at thumbnail size. Hand-picked by
 * looking at them - there's no metadata that captures "eye-catching".
 *
 * The rest (night streets, smoke, fog, star fields) are perfectly good clips
 * but they go muddy small, and a wall that opens on three dark rectangles
 * looks broken rather than moody.
 */
const BRIGHT_IDS = [
  "dancer-silhouette",
  "coast-cliffs-aerial",
  "img-ink-square",
  "desert-dunes-wind",
  "ocean-waves-vertical",
  "portrait-wind-hair",
  "snow-falling-pines",
  "fireworks-night-sky",
  "coffee-pour-square",
  "img-city-bokeh-square",
  "img-neon-alley",
  "waterfall-forest-drop",
  "img-mountain-lake",
  "skate-street-run",
  "img-waterfall-tall",
  "img-coast-aerial",
  "img-snow-trees",
  "img-street-fashion",
  "perfume-bottle-square",
  "img-coffee-square",
  "rain-on-glass",
  "img-portrait-wind",
  "drone-mountain-ridge",
];

/**
 * The muddiest clips - near-black night streets, smoke on black, fog, star
 * fields. Fine in the dialog at full size, but at thumbnail scale they read as
 * empty grey boxes. Pushed to the very end so a column can never open on one.
 */
const SINK_IDS = [
  "neon-street-rain",
  "night-walk-city",
  "car-night-drive",
  "stars-night-sky",
  "smoke-abstract-square",
  "ink-water-vertical",
  "forest-fog-morning",
  "img-forest-fog",
  "img-stars-landscape",
  "img-smoke-tall",
  "img-perfume-square",
];

/**
 * Wall order.
 *
 * CSS multi-column fills each column top to bottom before starting the next,
 * so the visible *top row* is the first item of every column - roughly indices
 * 0, n, 2n... for n items per column. n changes with the breakpoint (2/3/4/5
 * columns), so we can't target those slots directly.
 *
 * Alternating bright/dark means every even index is a bright clip. Column
 * starts land on even indices at each of our breakpoints, so the top row comes
 * up bright at any width, and index 0 is bright by construction.
 */
export function exploreOrder(kind?: SampleKind): Sample[] {
  const pool = getSamples(kind);
  const sink = new Set(SINK_IDS);

  const bright = BRIGHT_IDS.map((id) => pool.find((s) => s.id === id)).filter(
    (s): s is Sample => Boolean(s),
  );
  const brightIds = new Set(bright.map((s) => s.id));
  const mid = pool.filter((s) => !brightIds.has(s.id) && !sink.has(s.id));
  const tail = pool.filter((s) => sink.has(s.id));

  const ordered: Sample[] = [];
  for (let i = 0; i < Math.max(bright.length, mid.length); i += 1) {
    if (bright[i]) ordered.push(bright[i]);
    if (mid[i]) ordered.push(mid[i]);
  }
  return [...ordered, ...tail];
}

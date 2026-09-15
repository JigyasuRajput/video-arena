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
  source: "Pexels" | "Mixkit";
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

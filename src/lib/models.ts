import type { Aspect } from "@/lib/samples";

/**
 * Model catalogue.
 *
 * These are real model names, but every capability value below is **demo
 * config we made up** - durations, resolutions, audio support, frame support.
 * Nothing here is ever called; generation is simulated from a stock library.
 * The numbers deliberately differ between models so the form logic (snapping
 * unsupported values, disabling slots) actually gets exercised.
 */

export type VideoResolution = "480p" | "720p" | "1080p";

export type VideoModel = {
  id: string;
  name: string;
  blurb: string;
  badge?: "Top" | "New";
  durations: number[];
  aspects: Aspect[];
  resolutions: VideoResolution[];
  audio: boolean;
  startFrame: boolean;
  endFrame: boolean;
  /** 0-3 */
  maxRefs: number;
};

export const VIDEO_MODELS: VideoModel[] = [
  {
    id: "veo-3",
    name: "Veo 3",
    blurb: "Best overall motion and prompt adherence. Generates audio.",
    badge: "Top",
    // Only does 8s, so switching to it always snaps the duration.
    durations: [8],
    aspects: ["16:9", "9:16"],
    resolutions: ["720p", "1080p"],
    audio: true,
    startFrame: true,
    endFrame: false,
    maxRefs: 3,
  },
  {
    id: "kling-2-5",
    name: "Kling 2.5",
    blurb: "Strong character consistency and start/end frame control.",
    durations: [5, 10],
    aspects: ["16:9", "9:16", "1:1"],
    resolutions: ["720p", "1080p"],
    audio: false,
    startFrame: true,
    endFrame: true,
    maxRefs: 3,
  },
  {
    id: "seedance-1-0",
    name: "Seedance 1.0",
    blurb: "Fast, cinematic camera moves. Good for wide landscape shots.",
    badge: "New",
    durations: [4, 6, 8, 10],
    // Landscape and portrait only - no square.
    aspects: ["16:9", "9:16"],
    resolutions: ["480p", "720p", "1080p"],
    audio: true,
    startFrame: true,
    endFrame: true,
    maxRefs: 2,
  },
  {
    id: "wan-2-5",
    name: "Wan 2.5",
    blurb: "Open weights. Reliable for product and object motion.",
    durations: [5, 8],
    aspects: ["16:9", "9:16", "1:1"],
    resolutions: ["480p", "720p"],
    audio: false,
    startFrame: true,
    endFrame: true,
    maxRefs: 1,
  },
  {
    id: "hailuo-02",
    name: "Hailuo 02",
    blurb: "Expressive human movement and dance. No reference images.",
    durations: [6, 10],
    aspects: ["16:9", "9:16", "1:1"],
    resolutions: ["720p"],
    audio: false,
    startFrame: true,
    endFrame: false,
    maxRefs: 0,
  },
  {
    id: "gen-4-turbo",
    name: "Gen-4 Turbo",
    blurb: "Quickest turnaround. Lower resolution, good for drafts.",
    durations: [4, 5, 6],
    aspects: ["16:9", "9:16", "1:1"],
    resolutions: ["480p", "720p"],
    audio: false,
    startFrame: true,
    endFrame: true,
    maxRefs: 2,
  },
];

export type ImageQuality = "standard" | "high";
export type ImageResolution = "1K" | "2K";

export type ImageModel = {
  id: string;
  name: string;
  blurb: string;
  badge?: "Top" | "New";
  aspects: Aspect[];
  qualities: ImageQuality[];
  resolutions: ImageResolution[];
  /** 0-4 */
  maxRefs: number;
  /** 1-4 */
  maxCount: number;
};

export const IMAGE_MODELS: ImageModel[] = [
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    blurb: "Best all-round quality and text rendering.",
    badge: "Top",
    aspects: ["1:1", "4:5", "3:4", "16:9", "9:16"],
    qualities: ["standard", "high"],
    resolutions: ["1K", "2K"],
    maxRefs: 4,
    maxCount: 4,
  },
  {
    id: "flux-1-1-pro",
    name: "Flux 1.1 Pro",
    blurb: "Photographic detail and reliable composition.",
    aspects: ["1:1", "4:5", "3:4", "16:9", "9:16"],
    qualities: ["standard", "high"],
    resolutions: ["1K", "2K"],
    maxRefs: 2,
    maxCount: 4,
  },
  {
    id: "seedream-4",
    name: "Seedream 4",
    blurb: "Stylised and illustrative looks. Square and portrait only.",
    badge: "New",
    aspects: ["1:1", "4:5", "3:4"],
    qualities: ["standard", "high"],
    resolutions: ["1K"],
    maxRefs: 2,
    // Caps at 2 images, so the count stepper has to clamp.
    maxCount: 2,
  },
  {
    id: "ideogram-3",
    name: "Ideogram 3",
    blurb: "Graphic design and typography. No reference images.",
    aspects: ["1:1", "16:9", "9:16"],
    qualities: ["high"],
    resolutions: ["1K", "2K"],
    maxRefs: 0,
    maxCount: 4,
  },
];

export function getVideoModel(id: string): VideoModel | undefined {
  return VIDEO_MODELS.find((model) => model.id === id);
}

export function getImageModel(id: string): ImageModel | undefined {
  return IMAGE_MODELS.find((model) => model.id === id);
}

export const DEFAULT_VIDEO_MODEL = VIDEO_MODELS[1]; // Kling: widest support
export const DEFAULT_IMAGE_MODEL = IMAGE_MODELS[0];

/** Nearest supported value, for snapping when the model changes. */
export function nearestDuration(durations: number[], wanted: number): number {
  return durations.reduce((best, d) =>
    Math.abs(d - wanted) < Math.abs(best - wanted) ? d : best,
  );
}

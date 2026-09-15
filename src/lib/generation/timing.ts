import type { ImageQuality, ImageResolution, VideoResolution } from "@/lib/models";
import type { JobState } from "@/lib/generation/types";

/** FNV-1a. Small, stable, and the same answer on the server and in the browser. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Everything sits in the queue briefly before it starts, like the real thing. */
export const QUEUE_MS = 1500;

const VIDEO_CAP_MS = 15_000;
const IMAGE_MIN_MS = 3000;
const IMAGE_CAP_MS = 6000;

/** ±800ms so two identical requests don't finish in lockstep. */
function jitter(hash: number): number {
  return (hash % 1601) - 800;
}

export function videoEtaMs(
  duration: number,
  resolution: VideoResolution,
  hash: number,
): number {
  const base = 6000 + duration * 600 + (resolution === "1080p" ? 3000 : 0);
  return Math.min(VIDEO_CAP_MS, Math.max(QUEUE_MS + 1500, base + jitter(hash)));
}

export function imageEtaMs(
  count: number,
  quality: ImageQuality,
  resolution: ImageResolution,
  hash: number,
): number {
  const base =
    2600 + count * 500 + (quality === "high" ? 700 : 0) + (resolution === "2K" ? 600 : 0);
  return Math.min(IMAGE_CAP_MS, Math.max(IMAGE_MIN_MS, base + jitter(hash)));
}

/**
 * Where a failed job gives up: the point the bar reads ~50%.
 *
 * That's a smaller slice of the *time* than it sounds, because the curve below
 * front-loads progress - failing at the halfway point in seconds would show 73%
 * and read as "it nearly worked".
 */
const FAIL_AT_T = 0.294;

export function failAtMs(etaMs: number): number {
  return QUEUE_MS + (etaMs - QUEUE_MS) * FAIL_AT_T;
}

/**
 * Progress from elapsed time.
 *
 * Deliberately not linear: it runs away fast and then crawls, which is what
 * real queues feel like and what stops a 15s wait looking like a stuck bar.
 * It's also capped below 100 while generating - only completion shows 100.
 */
export function progressAt(elapsedMs: number, etaMs: number): {
  state: JobState;
  progress: number;
} {
  if (elapsedMs >= etaMs) return { state: "completed", progress: 100 };

  if (elapsedMs < QUEUE_MS) {
    const t = Math.max(0, elapsedMs / QUEUE_MS);
    return { state: "queued", progress: Math.round(t * 6) };
  }

  const span = Math.max(1, etaMs - QUEUE_MS);
  const t = Math.min(1, (elapsedMs - QUEUE_MS) / span);
  const eased = 1 - Math.pow(1 - t, 1.9);
  return { state: "generating", progress: Math.min(97, Math.round(6 + eased * 91)) };
}

import {
  nearestDuration,
  type ImageModel,
  type ImageQuality,
  type ImageResolution,
  type VideoModel,
  type VideoResolution,
} from "@/lib/models";
import type { Aspect } from "@/lib/samples";

/**
 * Form state and the snapping rules, shared by both create pages.
 *
 * Models don't all support the same things, so changing the model has to move
 * whatever no longer fits and say so out loud. One helper does the moving and
 * writes the sentence; the per-kind functions just list the fields.
 */

export type VideoSettings = {
  model: string;
  duration: number;
  aspect: Aspect;
  resolution: VideoResolution;
  audio: boolean;
};

export type ImageSettings = {
  model: string;
  aspect: Aspect;
  quality: ImageQuality;
  resolution: ImageResolution;
  count: number;
};

export type SnapOutcome<T> = { next: T; messages: string[] };

function snapField<T>({
  modelName,
  label,
  supported,
  current,
  format = String,
  nearest,
}: {
  modelName: string;
  label: string;
  supported: readonly T[];
  current: T;
  format?: (value: T) => string;
  nearest?: (supported: readonly T[], wanted: T) => T;
}): { value: T; message?: string } {
  if (supported.includes(current)) return { value: current };

  const value = nearest ? nearest(supported, current) : supported[0];
  const message =
    supported.length === 1
      ? `${modelName} only does ${format(value)}, switched ${label} to ${format(value)}`
      : `${modelName} doesn't do ${format(current)}, switched ${label} to ${format(value)}`;
  return { value, message };
}

/** Closest entry by position in a quality-ordered list, e.g. 1080p -> 720p. */
function nearestInOrder<T>(order: readonly T[]) {
  return (supported: readonly T[], wanted: T): T => {
    const target = order.indexOf(wanted);
    if (target === -1) return supported[0];
    return supported.reduce((best, candidate) =>
      Math.abs(order.indexOf(candidate) - target) <
      Math.abs(order.indexOf(best) - target)
        ? candidate
        : best,
    );
  };
}

const VIDEO_RES_ORDER: readonly VideoResolution[] = ["480p", "720p", "1080p"];
const IMAGE_RES_ORDER: readonly ImageResolution[] = ["1K", "2K"];
const QUALITY_ORDER: readonly ImageQuality[] = ["standard", "high"];

export function snapVideoSettings(
  model: VideoModel,
  current: VideoSettings,
): SnapOutcome<VideoSettings> {
  const messages: string[] = [];
  const take = <T,>(result: { value: T; message?: string }) => {
    if (result.message) messages.push(result.message);
    return result.value;
  };

  const duration = take(
    snapField({
      modelName: model.name,
      label: "duration",
      supported: model.durations,
      current: current.duration,
      format: (value) => `${value}s`,
      nearest: (supported, wanted) => nearestDuration([...supported], wanted),
    }),
  );

  const aspect = take(
    snapField({
      modelName: model.name,
      label: "aspect",
      supported: model.aspects,
      current: current.aspect,
    }),
  );

  const resolution = take(
    snapField({
      modelName: model.name,
      label: "resolution",
      supported: model.resolutions,
      current: current.resolution,
      nearest: nearestInOrder(VIDEO_RES_ORDER),
    }),
  );

  let audio = current.audio;
  if (audio && !model.audio) {
    audio = false;
    messages.push(`${model.name} has no audio, turned audio off`);
  }

  return {
    next: { model: model.id, duration, aspect, resolution, audio },
    messages,
  };
}

export function snapImageSettings(
  model: ImageModel,
  current: ImageSettings,
): SnapOutcome<ImageSettings> {
  const messages: string[] = [];
  const take = <T,>(result: { value: T; message?: string }) => {
    if (result.message) messages.push(result.message);
    return result.value;
  };

  const aspect = take(
    snapField({
      modelName: model.name,
      label: "aspect",
      supported: model.aspects,
      current: current.aspect,
    }),
  );

  const quality = take(
    snapField({
      modelName: model.name,
      label: "quality",
      supported: model.qualities,
      current: current.quality,
      format: (value) => (value === "high" ? "High" : "Standard"),
      nearest: nearestInOrder(QUALITY_ORDER),
    }),
  );

  const resolution = take(
    snapField({
      modelName: model.name,
      label: "resolution",
      supported: model.resolutions,
      current: current.resolution,
      nearest: nearestInOrder(IMAGE_RES_ORDER),
    }),
  );

  let count = current.count;
  if (count > model.maxCount) {
    count = model.maxCount;
    messages.push(
      `${model.name} makes at most ${model.maxCount} at a time, switched count to ${model.maxCount}`,
    );
  }

  return { next: { model: model.id, aspect, quality, resolution, count }, messages };
}

/** Why a slot is off, phrased for a tooltip. Also used as the disabled reason. */
export function unsupportedReason(modelName: string, what: string): string {
  return `${modelName} doesn't support ${what}.`;
}

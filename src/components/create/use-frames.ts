"use client";

import { makeThumb } from "@/lib/generation/thumbs";
import type { Sample } from "@/lib/samples";

/**
 * A picked image, in the two forms the app needs it.
 *
 * `previewUrl` is what the panel shows - an object URL for an upload, a public
 * path for a sample. `thumb` is the ~256px data URL that goes to the library,
 * because object URLs are dead the moment the tab reloads and full files would
 * eat the storage quota in two uploads.
 */
export type Frame = {
  previewUrl: string;
  /** "" if the downscale failed - a missing thumbnail is not worth failing over. */
  thumb: string;
  /** previewUrl needs revoking when this frame goes away. */
  isObjectUrl: boolean;
  /** Set when the frame came from a remix or an Animate link. */
  fromSampleId?: string;
};

export async function frameFromFile(file: File): Promise<Frame> {
  return {
    previewUrl: URL.createObjectURL(file),
    thumb: await makeThumb(file),
    isObjectUrl: true,
  };
}

/** Sample media is already a small public path, so it is its own thumbnail. */
export function frameFromSample(sample: Sample): Frame {
  const src = sample.kind === "video" ? (sample.poster ?? sample.src) : sample.src;
  return { previewUrl: src, thumb: src, isObjectUrl: false, fromSampleId: sample.id };
}

export function releaseFrame(frame: Frame | null | undefined): void {
  if (frame?.isObjectUrl) URL.revokeObjectURL(frame.previewUrl);
}

export function frameThumb(frame: Frame | null | undefined): string | undefined {
  return frame?.thumb || undefined;
}

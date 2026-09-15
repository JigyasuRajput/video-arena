"use client";

/**
 * Uploaded files never leave the browser, and the full image never reaches
 * localStorage either - a couple of 8MB photos would blow the quota on their
 * own. The panel previews from an object URL; the library keeps only this
 * downscaled JPEG data URL.
 */

const THUMB_MAX_PX = 256;
const THUMB_QUALITY = 0.72;

export async function makeThumb(file: File, maxPx = THUMB_MAX_PX): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const scale = Math.min(1, maxPx / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return "";
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", THUMB_QUALITY);
  } catch {
    // A thumbnail is a nicety; a failure here must not block the generation.
    return "";
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("decode failed"));
    image.src = src;
  });
}

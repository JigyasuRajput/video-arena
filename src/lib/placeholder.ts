/**
 * A 1x1 PNG of --surface-2 (#1a1a1e), used as next/image's blur placeholder.
 *
 * Without an explicit placeholder next/image paints nothing while loading, and
 * on a slow connection the browser can flash the page white before the real
 * pixels arrive. Handing it a solid dark source means the card is always the
 * surface colour until the image lands.
 */
export const DARK_PLACEHOLDER = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mOQkpIDAACkAFPKOg+yAAAAAElFTkSuQmCC";

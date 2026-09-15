"use client";

/**
 * Decides which wall videos are allowed to play.
 *
 * The wall can hold 24 clips. Letting every visible one play pins the CPU and
 * makes scrolling stutter, so at most MAX_PLAYING run at once and the ones
 * nearest the middle of the viewport win. Everything else is paused.
 *
 * Deliberately a module singleton driving the <video> elements directly rather
 * than React state - this reconciles on every scroll frame, and re-rendering
 * two dozen cards that often would cost more than the videos do.
 */
const MAX_PLAYING = 6;

type Entry = { el: HTMLVideoElement; visible: boolean };

const entries = new Map<string, Entry>();
let frame: number | null = null;

function reconcile() {
  frame = null;
  if (typeof window === "undefined") return;

  const centre = window.innerHeight / 2;
  const visible = [...entries.entries()]
    .filter(([, entry]) => entry.visible && entry.el.isConnected)
    .map(([id, entry]) => {
      const rect = entry.el.getBoundingClientRect();
      return { id, entry, distance: Math.abs((rect.top + rect.bottom) / 2 - centre) };
    })
    .sort((a, b) => a.distance - b.distance);

  const allowed = new Set(visible.slice(0, MAX_PLAYING).map((item) => item.id));

  for (const [id, entry] of entries) {
    if (allowed.has(id)) {
      // play() rejects if the element is detached or autoplay is blocked;
      // neither is recoverable here and neither should surface as an error.
      if (entry.el.paused) void entry.el.play().catch(() => {});
    } else if (!entry.el.paused) {
      entry.el.pause();
    }
  }
}

function schedule() {
  if (frame !== null || typeof window === "undefined") return;
  frame = window.requestAnimationFrame(reconcile);
}

export function registerVideo(id: string, el: HTMLVideoElement) {
  entries.set(id, { el, visible: false });
  return () => {
    entries.delete(id);
    schedule();
  };
}

export function setVideoVisible(id: string, visible: boolean) {
  const entry = entries.get(id);
  if (!entry || entry.visible === visible) return;
  entry.visible = visible;
  schedule();
}

/** Scrolling changes which clips are nearest the centre, so re-rank on scroll. */
export function startPlaybackWatcher() {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  return () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
  };
}

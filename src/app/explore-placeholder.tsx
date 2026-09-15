"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { MediaDialog } from "@/components/media/media-dialog";
import { useMediaParam } from "@/components/media/use-media-param";

/**
 * Temporary. Spec 04 replaces this with the real masonry wall over the sample
 * library. It exists now so the `?media=` plumbing from spec 03 is actually
 * exercisable - open, link, back button, Esc, arrows.
 */
const TILES = [
  { id: "placeholder-a", label: "Placeholder A", tint: "from-[#1b2a12] to-[#d7ff3a]" },
  { id: "placeholder-b", label: "Placeholder B", tint: "from-[#2a1230] to-[#ff3d8b]" },
  { id: "placeholder-c", label: "Placeholder C", tint: "from-[#0f2430] to-[#3ddc97]" },
];

export function ExplorePlaceholder() {
  const { mediaId, openMedia, closeMedia } = useMediaParam();
  const index = TILES.findIndex((tile) => tile.id === mediaId);
  const current = index >= 0 ? TILES[index] : undefined;

  const step = (delta: number) => {
    const next = TILES[(index + delta + TILES.length) % TILES.length];
    if (next) openMedia(next.id);
  };

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {TILES.map((tile) => (
          <button
            key={tile.id}
            type="button"
            onClick={() => openMedia(tile.id)}
            className={`aspect-video w-full rounded-lg bg-gradient-to-br ${tile.tint} outline-none transition-transform duration-150 ease-[var(--ease-out-soft)] hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2`}
          >
            <span className="sr-only">{tile.label}</span>
          </button>
        ))}
      </div>

      <MediaDialog
        open={Boolean(current)}
        onClose={closeMedia}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        title={current?.label ?? "Media"}
        media={
          <div
            className={`aspect-video w-full bg-gradient-to-br ${current?.tint ?? ""}`}
          />
        }
        panel={
          <>
            <Badge variant="accentSoft">Demo sample</Badge>
            <p className="text-lg font-semibold">{current?.label}</p>
            <p className="text-base text-text-muted">
              Placeholder for the real media panel. Arrow keys step through,
              Esc closes, and the back button closes too.
            </p>
          </>
        }
      />
    </>
  );
}

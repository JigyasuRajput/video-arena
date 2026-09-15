"use client";

import Image from "next/image";
import { cn } from "cn";
import { Play } from "lucide-react";

import { DARK_PLACEHOLDER } from "@/lib/placeholder";
import type { Sample } from "@/lib/samples";

/**
 * What the results side shows before anything has been generated in this
 * browser: the pitch, then a way in that doesn't require thinking up a prompt.
 */
export function VideoEmptyState({
  samples,
  onPick,
}: {
  samples: Sample[];
  onPick: (sample: Sample) => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-surface/60 px-5 py-12 text-center sm:py-16">
      <h2 className="display max-w-lg text-2xl sm:text-3xl">
        Your shot,
        <br />
        <span className="text-accent">in about ten seconds</span>
      </h2>
      <p className="mt-4 max-w-md text-lg text-text-muted">
        Fill in the panel and hit Generate. Results land here, newest first, and
        stay in this browser.
      </p>

      <p className="mt-10 text-xs font-semibold tracking-wide text-text-faint uppercase">
        Try one of these
      </p>

      <div className="mt-4 grid w-full max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3">
        {samples.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => onPick(sample)}
            // A uniform tile, not each sample's own ratio - mixed 16:9 and 9:16
            // in one grid leaves ragged rows and half-empty cells.
            className={cn(
              "group relative aspect-[4/5] overflow-hidden rounded-md bg-surface-2 text-left outline-none",
              "transition-transform duration-150 ease-[var(--ease-out-soft)] hover:-translate-y-0.5",
              "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
            )}
          >
            <Image
              src={sample.poster ?? sample.src}
              alt={sample.prompt}
              fill
              sizes="(max-width: 640px) 45vw, 220px"
              placeholder="blur"
              blurDataURL={DARK_PLACEHOLDER}
              className="bg-surface-2 object-cover opacity-80 transition-opacity duration-200 group-hover:opacity-100"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 flex items-end gap-1.5 p-2">
              <Play
                className="mt-px size-3 shrink-0 text-accent"
                aria-hidden="true"
              />
              <span className="line-clamp-2 text-sm leading-snug text-white">
                {sample.prompt}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

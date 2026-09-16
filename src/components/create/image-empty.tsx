"use client";

import Image from "next/image";

import { DARK_PLACEHOLDER } from "@/lib/placeholder";
import type { Sample } from "@/lib/samples";

/**
 * The image page's opening screen: a fan of sample cards over the headline.
 *
 * Deliberately decorative - the way in here is the docked bar, not these
 * tiles, so they're `aria-hidden` rather than buttons.
 */
export function ImageEmptyState({ samples }: { samples: Sample[] }) {
  const middle = (samples.length - 1) / 2;

  return (
    <div className="flex flex-col items-center px-4 py-10 text-center sm:py-16">
      <div
        aria-hidden="true"
        className="relative mb-10 h-44 w-full max-w-lg sm:h-52"
      >
        {samples.map((sample, index) => {
          const offset = index - middle;
          return (
            <div
              key={sample.id}
              className="absolute top-0 aspect-[3/4] w-28 overflow-hidden rounded-lg border border-border-strong bg-surface-2 shadow-[var(--shadow-pop)] sm:w-32"
              style={{
                left: "50%",
                transform: `translateX(-50%) translateX(${offset * 68}px) translateY(${Math.abs(offset) * 8}px) rotate(${offset * 6}deg)`,
                zIndex: 10 - Math.abs(offset),
              }}
            >
              <Image
                src={sample.src}
                alt=""
                fill
                // The rendered width, per breakpoint. "140px" asked the
                // optimiser for an asset narrower than the card actually is on
                // a 2x display, so the fan came back soft.
                sizes="(min-width: 640px) 128px, 112px"
                // Eager, not lazy. These are the first thing on the page and
                // there is nothing behind them: with the dark blur placeholder,
                // five cards that haven't loaded yet read as five empty boxes
                // rather than as loading. priority also takes them out of the
                // lazy-loading intersection check, which is one less thing that
                // can decide they aren't visible yet.
                priority
                placeholder="blur"
                blurDataURL={DARK_PLACEHOLDER}
                className="bg-surface-2 object-cover"
              />
            </div>
          );
        })}
      </div>

      <h1 className="display max-w-xl text-2xl sm:text-3xl">
        Four looks,
        <br />
        <span className="text-accent">one line of description</span>
      </h1>
      <p className="mt-4 max-w-md text-lg text-text-muted">
        Type below and pick how many you want. Results stack up here, and any
        one of them can become the first frame of a video.
      </p>
    </div>
  );
}

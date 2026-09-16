"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "cn";
import { Check, Film, ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { requestedModelName } from "@/components/create/result-meta";
import { usePrefersReducedMotion } from "@/components/explore/use-reduced-motion";
import { DARK_PLACEHOLDER } from "@/lib/placeholder";
import { relativeTime } from "@/lib/relative-time";
import { getSample } from "@/lib/samples";
import { isActive, type Generation } from "@/lib/store/library";

const STATUS_LABEL: Record<Generation["status"], string> = {
  queued: "Queued",
  generating: "Generating",
  completed: "Done",
  failed: "Failed",
  canceled: "Canceled",
};

/**
 * One generation in the library grid.
 *
 * Video results show their poster and only play on hover. The explore wall
 * needs a playback manager because two dozen clips autoplay there; here
 * nothing plays until you point at it, so it doesn't need one.
 */
export function LibraryCard({
  generation,
  onOpen,
  selecting,
  selected,
  onToggleSelect,
  now,
}: {
  generation: Generation;
  onOpen: (generation: Generation, index: number) => void;
  selecting: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  /** Passed in so every card in a render agrees on "now". */
  now: number;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const request = generation.request;
  const sample = getSample(generation.resultSampleIds[0] ?? "");
  const completed = generation.status === "completed" && Boolean(sample);
  const running = isActive(generation);
  const broken =
    generation.status === "failed" || generation.status === "canceled";

  const KindIcon = generation.kind === "video" ? Film : ImageIcon;
  const count = generation.resultSampleIds.length;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-surface transition-colors duration-150",
        selected ? "border-accent" : "border-border hover:border-border-strong",
      )}
      // Video results stay on their poster until you point at one. Nothing on
      // this page plays on its own, so it needs no playback manager.
      onMouseEnter={() => {
        if (!reducedMotion) void videoRef.current?.play().catch(() => {});
      }}
      onMouseLeave={() => videoRef.current?.pause()}
    >
      {/* A uniform 4:5 tile, not each result's own aspect. Spec 05 hit the
          same thing on the video empty state: real ratios in a grid leave
          ragged rows and half-empty cells, and a 9:16 result is twice the
          height of a 16:9 one beside it. The aspect is still on the card, as a
          badge, and the dialog shows the result at its real shape. */}
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
        {completed && sample ? (
          <>
            <Image
              src={sample.kind === "video" ? (sample.poster ?? sample.src) : sample.src}
              alt={request.prompt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              placeholder="blur"
              blurDataURL={DARK_PLACEHOLDER}
              className="bg-surface-2 object-cover"
            />
            {sample.kind === "video" && !reducedMotion && (
              <video
                ref={videoRef}
                src={sample.src}
                poster={sample.poster}
                muted
                loop
                playsInline
                preload="none"
                tabIndex={-1}
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300",
                  "data-[playing=true]:opacity-100",
                )}
                onPlaying={(event) =>
                  event.currentTarget.setAttribute("data-playing", "true")
                }
                onPause={(event) =>
                  event.currentTarget.setAttribute("data-playing", "false")
                }
              />
            )}
          </>
        ) : running ? (
          <>
            <div className="va-shimmer absolute inset-0" aria-hidden="true" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="tabular display text-xl text-text" aria-hidden="true">
                {generation.progress}%
              </span>
              <span className="text-sm text-text-muted">
                {STATUS_LABEL[generation.status]}
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
            <p className="text-sm text-text-muted">
              {broken
                ? (generation.status === "canceled"
                    ? "Canceled."
                    : (generation.error ?? "Generation failed."))
                : "Result is no longer available."}
            </p>
          </div>
        )}

        {/* Whole-tile target. In select mode it toggles instead of opening, so
            a long multi-delete never opens a dialog by accident. */}
        <button
          type="button"
          onClick={() =>
            selecting
              ? onToggleSelect(generation.id)
              : completed && onOpen(generation, 0)
          }
          disabled={!selecting && !completed}
          aria-label={
            selecting
              ? `${selected ? "Deselect" : "Select"} ${request.prompt.slice(0, 60)}`
              : `Open ${request.prompt.slice(0, 60)}`
          }
          className={cn(
            "absolute inset-0 z-20 h-full w-full cursor-pointer outline-none",
            "focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2",
            "disabled:cursor-default",
          )}
        />

        <div className="pointer-events-none absolute top-2 left-2 z-10 flex flex-wrap gap-1">
          <Badge
            variant={
              completed
                ? "overlay"
                : running
                  ? "accentSoft"
                  : broken
                    ? "danger"
                    : "outline"
            }
            size="xs"
          >
            {STATUS_LABEL[generation.status]}
          </Badge>
          <Badge variant="overlay" size="xs">
            {request.aspect}
          </Badge>
          {count > 1 && (
            <Badge variant="overlay" size="xs">
              <span className="tabular">{count}</span>
            </Badge>
          )}
        </div>

        <span
          className="pointer-events-none absolute top-2 right-2 z-10 inline-flex size-6 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md"
          aria-hidden="true"
        >
          <KindIcon className="size-3" />
        </span>

        {selecting && (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute bottom-2 left-2 z-10 inline-flex size-6 items-center justify-center rounded-full border",
              selected
                ? "border-accent bg-accent text-accent-fg"
                : "border-white/25 bg-black/50 text-transparent backdrop-blur-md",
            )}
          >
            <Check className="size-3.5" />
          </span>
        )}

        {/* The prompt on hover, per the spec. Touch has no hover, so the
            settings row below always carries enough to tell cards apart. */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 pt-8",
            "opacity-0 transition-opacity duration-150",
            "group-hover:opacity-100 group-focus-within:opacity-100",
          )}
        >
          <p className="line-clamp-2 text-xs leading-snug text-white/90">
            {request.prompt}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-2.5 py-2">
        <span className="truncate text-xs text-text-muted">
          {requestedModelName(request)}
        </span>
        <span className="shrink-0 text-xs text-text-faint">
          {relativeTime(generation.createdAt, now)}
        </span>
      </div>
    </div>
  );
}

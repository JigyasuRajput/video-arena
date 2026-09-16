"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";
import { Film, ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { aspectRatioCss } from "@/components/create/aspect-icon";
import { useElapsedSeconds } from "@/components/create/generating-box";
import {
  FrameThumbs,
  PromptText,
  RequestBadges,
  ResultActions,
  RetryButton,
  SampleCredits,
} from "@/components/create/result-meta";
import { DARK_PLACEHOLDER } from "@/lib/placeholder";
import { getSample, type Sample } from "@/lib/samples";
import type { Generation } from "@/lib/store/library";

/** Explicit classes - Tailwind can't see a template-built column count. */
const GRIDS: Record<number, string> = {
  1: "grid-cols-1 max-w-[300px]",
  2: "grid-cols-2 max-w-[620px]",
  3: "grid-cols-2 sm:grid-cols-3 max-w-[820px]",
  4: "grid-cols-2 sm:grid-cols-4 max-w-[900px]",
};

export function ImageResultCard({
  generation,
  onOpenMedia,
  onUseAsReference,
  onRegenerate,
  onReuse,
  onDelete,
  onCancel,
  onRetry,
}: {
  generation: Generation;
  /** Takes the tile's index, not its sample id - see media-id.ts. */
  onOpenMedia: (index: number) => void;
  onUseAsReference: (sample: Sample) => void;
  onRegenerate: () => void;
  onReuse: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const elapsed = useElapsedSeconds(generation.createdAt);
  const request = generation.request;
  if (request.kind !== "image") return null;

  const pending =
    generation.status === "queued" || generation.status === "generating";
  const broken =
    generation.status === "failed" || generation.status === "canceled";

  const tiles = pending
    ? Array.from({ length: request.count }, () => undefined)
    : generation.resultSampleIds.map((id) => getSample(id));

  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      {broken ? (
        <div className="flex flex-col items-start gap-3 rounded-md border border-border bg-surface-2/60 p-5">
          <p className="text-base text-text-muted">
            {generation.status === "canceled"
              ? "Canceled."
              : (generation.error ?? "Generation failed.")}
          </p>
          <RetryButton onRetry={onRetry} />
        </div>
      ) : (
        <div className={cn("grid gap-2", GRIDS[request.count] ?? GRIDS[4])}>
          {tiles.map((sample, index) => (
            <div
              key={sample?.id ?? `pending-${index}`}
              className="group relative overflow-hidden rounded-md bg-surface-2"
              style={{ aspectRatio: aspectRatioCss(request.aspect) }}
            >
              {sample ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenMedia(index)}
                    aria-label={`Open image ${index + 1}: ${request.prompt.slice(0, 60)}`}
                    className={cn(
                      "absolute inset-0 h-full w-full outline-none",
                      // Purely visual stagger - the job completed all at once.
                      "animate-in fade-in zoom-in-95 duration-500 ease-[var(--ease-out-soft)]",
                      "focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2",
                    )}
                    style={{
                      animationDelay: `${index * 110}ms`,
                      animationFillMode: "backwards",
                    }}
                  >
                    <Image
                      src={sample.src}
                      alt={request.prompt}
                      fill
                      sizes="(max-width: 640px) 45vw, 240px"
                      placeholder="blur"
                      blurDataURL={DARK_PLACEHOLDER}
                      // object-cover so a sample borrowed from a nearby aspect
                      // still fills the requested box.
                      className="bg-surface-2 object-cover"
                    />
                  </button>

                  {/* Hidden until hover on pointer devices, always there on touch. */}
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-x-1 bottom-1 flex gap-1",
                      "transition-opacity duration-150",
                      "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100",
                    )}
                  >
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      className="pointer-events-auto bg-surface/90 backdrop-blur-sm"
                      onClick={() => onUseAsReference(sample)}
                      aria-label="Use as reference"
                      title="Use as reference"
                    >
                      <ImagePlus />
                    </Button>
                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                      className="pointer-events-auto flex-1 bg-surface/90 backdrop-blur-sm"
                    >
                      <Link
                        href={`/create/video?startFrame=${sample.id}&prompt=${encodeURIComponent(request.prompt)}`}
                        title="Use as the first frame of a video"
                      >
                        <Film /> Animate
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div
                  className="va-shimmer absolute inset-0"
                  aria-hidden="true"
                  style={{ animationDelay: `${index * 160}ms` }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {pending && (
        <div className="mt-3 flex items-center gap-3">
          <span className="h-1 w-32 overflow-hidden rounded-full bg-surface-3">
            <span
              className="block h-full rounded-full bg-accent transition-[width] duration-500 ease-[var(--ease-out-soft)]"
              style={{ width: `${generation.progress}%` }}
            />
          </span>
          <span className="text-sm text-text-muted" role="status" aria-live="polite">
            {generation.status === "queued" ? "Queued" : "Generating"}
            <span className="tabular"> · {generation.progress}% · {elapsed}s</span>
          </span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X /> Cancel
          </Button>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <RequestBadges request={request} />
        <PromptText text={request.prompt} />
        <FrameThumbs thumbs={generation.thumbs} />
        {generation.status === "completed" && (
          <SampleCredits sampleIds={generation.resultSampleIds} />
        )}
        <ResultActions
          generation={generation}
          onRegenerate={onRegenerate}
          onReuse={onReuse}
          onDelete={onDelete}
        />
      </div>
    </article>
  );
}

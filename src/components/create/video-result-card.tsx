"use client";

import * as React from "react";
import { cn } from "cn";

import { aspectRatioCss } from "@/components/create/aspect-icon";
import { FailedBox, GeneratingBox } from "@/components/create/generating-box";
import {
  FrameThumbs,
  PromptText,
  RequestBadges,
  ResultActions,
  RetryButton,
  SampleCredits,
} from "@/components/create/result-meta";
import { getSample } from "@/lib/samples";
import type { Generation } from "@/lib/store/library";

/** Muted autoplay is allowed everywhere, but Safari still wants asking twice. */
function useAutoPlay(ref: React.RefObject<HTMLVideoElement | null>, enabled: boolean) {
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const play = () => void el.play().catch(() => {});
    play();
    el.addEventListener("loadeddata", play);
    return () => el.removeEventListener("loadeddata", play);
  }, [enabled, ref]);
}

export function VideoResultCard({
  generation,
  onOpenMedia,
  onRegenerate,
  onReuse,
  onDelete,
  onCancel,
  onRetry,
}: {
  generation: Generation;
  onOpenMedia: (sampleId: string) => void;
  onRegenerate: () => void;
  onReuse: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const request = generation.request;
  const sample = getSample(generation.resultSampleIds[0] ?? "");
  const completed = generation.status === "completed" && sample;

  useAutoPlay(videoRef, Boolean(completed));

  if (request.kind !== "video") return null;

  // Portrait and square results would otherwise take the whole column and push
  // the info panel off screen.
  const mediaWidth = request.aspect === "16:9" ? "w-full" : "w-full max-w-[260px]";

  return (
    <article className="grid gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <div className={mediaWidth}>
        {generation.status === "queued" || generation.status === "generating" ? (
          <GeneratingBox
            aspect={request.aspect}
            progress={generation.progress}
            queued={generation.status === "queued"}
            since={generation.createdAt}
            backdrop={generation.thumbs.start}
            onCancel={onCancel}
          />
        ) : generation.status === "failed" || generation.status === "canceled" ? (
          <FailedBox
            aspect={request.aspect}
            message={
              generation.status === "canceled"
                ? "Canceled."
                : (generation.error ?? "Generation failed.")
            }
            action={<RetryButton onRetry={onRetry} />}
          />
        ) : completed ? (
          <button
            type="button"
            onClick={() => onOpenMedia(sample.id)}
            aria-label={`Open result: ${request.prompt.slice(0, 80)}`}
            className={cn(
              "group relative block w-full overflow-hidden rounded-md bg-surface-2 outline-none",
              "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
            )}
            style={{ aspectRatio: aspectRatioCss(request.aspect) }}
          >
            <video
              ref={videoRef}
              src={sample.src}
              poster={sample.poster}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              className="h-full w-full object-cover transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:scale-[1.02]"
            />
          </button>
        ) : (
          <FailedBox aspect={request.aspect} message="Result is no longer available." />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <RequestBadges request={request} />
        <PromptText text={request.prompt} />
        <FrameThumbs thumbs={generation.thumbs} />
        {generation.status === "completed" && (
          <SampleCredits sampleIds={generation.resultSampleIds} />
        )}
        <div className="mt-auto pt-1">
          <ResultActions
            generation={generation}
            onRegenerate={onRegenerate}
            onReuse={onReuse}
            onDelete={onDelete}
          />
        </div>
      </div>
    </article>
  );
}

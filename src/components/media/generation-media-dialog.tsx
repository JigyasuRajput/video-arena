"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Copy, RefreshCw, Settings2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MediaDialog } from "@/components/media/media-dialog";
import { aspectRatioCss } from "@/components/create/aspect-icon";
import {
  FrameThumbs,
  PromptText,
  RequestBadges,
  requestedModelName,
} from "@/components/create/result-meta";
import { DARK_PLACEHOLDER } from "@/lib/placeholder";
import { getSample } from "@/lib/samples";
import type { Generation } from "@/lib/store/library";

/**
 * The `?media=` viewer for a generation.
 *
 * Explore's dialog describes a stock clip - author, licence, "prompt idea".
 * None of that is the right answer for something the user asked for, so this
 * one talks about the request instead: what was asked of which model, the
 * prompt as typed, the frames that went in, and the four things you'd want to
 * do next.
 */
export function GenerationMediaDialog({
  generation,
  index,
  onClose,
  onPrev,
  onNext,
  onRegenerate,
  onReuse,
  onDelete,
}: {
  generation: Generation | undefined;
  /** Which of a grid's results was clicked. */
  index: number;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onRegenerate: (generation: Generation) => void;
  onReuse: (generation: Generation) => void;
  onDelete: (generation: Generation) => void;
}) {
  const sample = generation
    ? getSample(generation.resultSampleIds[index] ?? "")
    : undefined;
  const request = generation?.request;

  const copyPrompt = async () => {
    if (!request) return;
    try {
      await navigator.clipboard.writeText(request.prompt);
      toast.success("Prompt copied");
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  const open = Boolean(generation && sample && request);

  return (
    <MediaDialog
      open={open}
      onClose={onClose}
      onPrev={onPrev}
      onNext={onNext}
      title={request ? `Result for "${request.prompt.slice(0, 60)}"` : "Result"}
      description={request?.prompt}
      media={
        sample && request ? (
          /* Framed at the aspect that was *asked for*, with the sample covering
             it. A clip borrowed from another aspect is cropped the same way in
             the card, so the dialog shows what was clicked rather than
             re-framing it. */
          <div
            className="relative h-[78vh] max-h-full w-auto max-w-full"
            style={{ aspectRatio: aspectRatioCss(request.aspect) }}
          >
            {sample.kind === "video" ? (
              <video
                key={`${generation?.id}-${index}`}
                src={sample.src}
                poster={sample.poster}
                controls
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full bg-black object-cover"
              />
            ) : (
              <Image
                key={`${generation?.id}-${index}`}
                src={sample.src}
                alt={request.prompt}
                fill
                sizes="(max-width: 768px) 100vw, 860px"
                placeholder="blur"
                blurDataURL={DARK_PLACEHOLDER}
                className="bg-surface-2 object-cover"
              />
            )}
          </div>
        ) : null
      }
      panel={
        generation && request ? (
          <>
            <RequestBadges request={request} />

            <div>
              <h2 className="text-xs font-semibold tracking-wide text-text-faint uppercase">
                Your prompt
              </h2>
              <div className="mt-1">
                <PromptText text={request.prompt} />
              </div>
            </div>

            {generation.resultSampleIds.length > 1 && (
              <Badge variant="outline" className="self-start">
                <span className="tabular">
                  {index + 1} of {generation.resultSampleIds.length}
                </span>
              </Badge>
            )}

            <FrameThumbs thumbs={generation.thumbs} />

            <p className="text-sm text-text-faint">
              {requestedModelName(request)} was the requested model. Nothing was
              sent to it.
            </p>

            <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onRegenerate(generation)}
              >
                <RefreshCw /> Regenerate
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onReuse(generation)}
              >
                <Settings2 /> Reuse settings
              </Button>
              <Button variant="secondary" size="sm" onClick={copyPrompt}>
                <Copy /> Copy prompt
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(generation)}
                className="hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 /> Delete
              </Button>
            </div>
          </>
        ) : null
      }
    />
  );
}

"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Copy, Shuffle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MediaDialog } from "@/components/media/media-dialog";
import type { Sample } from "@/lib/samples";

export function SampleMediaDialog({
  sample,
  onClose,
  onPrev,
  onNext,
}: {
  sample: Sample | undefined;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  const copyPrompt = async () => {
    if (!sample) return;
    try {
      await navigator.clipboard.writeText(sample.prompt);
      setCopied(true);
      toast.success("Prompt idea copied");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  const remixHref = sample
    ? sample.kind === "video"
      ? `/create/video?remix=${sample.id}`
      : `/create/image?remix=${sample.id}`
    : "#";

  return (
    <MediaDialog
      open={Boolean(sample)}
      onClose={onClose}
      onPrev={onPrev}
      onNext={onNext}
      title={sample ? sample.prompt.slice(0, 80) : "Media"}
      description={sample?.prompt}
      media={
        sample ? (
          sample.kind === "video" ? (
            <video
              key={sample.id}
              src={sample.src}
              poster={sample.poster}
              controls
              autoPlay
              muted
              loop
              playsInline
              className="max-h-[70vh] w-full object-contain"
              style={{ aspectRatio: `${sample.width} / ${sample.height}` }}
            />
          ) : (
            <div
              className="relative w-full"
              style={{ aspectRatio: `${sample.width} / ${sample.height}`, maxHeight: "70vh" }}
            >
              <Image
                key={sample.id}
                src={sample.src}
                alt={sample.prompt}
                fill
                sizes="(max-width: 768px) 100vw, 860px"
                className="object-contain"
              />
            </div>
          )
        ) : null
      }
      panel={
        sample ? (
          <>
            {/* No "Demo sample" badge and no per-item credit here. The Demo
                build pill in the nav says what this app is, and /credits lists
                every file with its author and licence. Repeating it on each
                item was noise. */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">{sample.aspect}</Badge>
              {sample.durationSec !== undefined && (
                <Badge variant="outline">
                  <span className="tabular">{sample.durationSec}s</span>
                </Badge>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                {/* "Prompt idea", never "Prompt" - the clip wasn't made from it. */}
                <h2 className="text-xs font-semibold tracking-wide text-text-faint uppercase">
                  Prompt idea
                </h2>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={copyPrompt}
                  aria-label="Copy prompt idea"
                >
                  {copied ? <Check /> : <Copy />}
                </Button>
              </div>
              <p className="mt-1 text-base leading-relaxed text-text">
                {sample.prompt}
              </p>
            </div>

            <div className="flex flex-wrap gap-1">
              {sample.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* No download button: it's stock under someone else's licence. */}
            <div className="mt-auto flex gap-2 pt-2">
              <Button asChild variant="primary" className="flex-1">
                <Link href={remixHref}>
                  <Shuffle /> Remix
                </Link>
              </Button>
              <Button variant="secondary" onClick={copyPrompt}>
                Copy prompt
              </Button>
            </div>
          </>
        ) : null
      }
    />
  );
}

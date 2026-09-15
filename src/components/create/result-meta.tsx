"use client";

import * as React from "react";
import { cn } from "cn";
import { toast } from "sonner";
import { Copy, RefreshCw, RotateCcw, Settings2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getImageModel, getVideoModel } from "@/lib/models";
import { creditLine, getSample } from "@/lib/samples";
import type { GenerationRequest } from "@/lib/generation/types";
import type { Generation } from "@/lib/store/library";

/**
 * The info column beside a result. Identical for both kinds apart from which
 * settings it lists, which comes off the request's own `kind`.
 */

const SIMULATED_TOOLTIP =
  "Generation is simulated in this demo, the clip is a stock sample.";

export function SimulatedBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="accentSoft" tabIndex={0} className="cursor-help">
          Simulated
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{SIMULATED_TOOLTIP}</TooltipContent>
    </Tooltip>
  );
}

export function requestedModelName(request: GenerationRequest): string {
  const model =
    request.kind === "video"
      ? getVideoModel(request.model)
      : getImageModel(request.model);
  return model?.name ?? request.model;
}

export function RequestBadges({ request }: { request: GenerationRequest }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <SimulatedBadge />
      <Badge variant="outline">Requested: {requestedModelName(request)}</Badge>
      {request.kind === "video" ? (
        <>
          <Badge variant="outline">
            <span className="tabular">{request.duration}s</span>
          </Badge>
          <Badge variant="outline">{request.aspect}</Badge>
          <Badge variant="outline">{request.resolution}</Badge>
          <Badge variant="outline">Audio {request.audio ? "on" : "off"}</Badge>
        </>
      ) : (
        <>
          <Badge variant="outline">{request.aspect}</Badge>
          <Badge variant="outline">
            {request.quality === "high" ? "High" : "Standard"}
          </Badge>
          <Badge variant="outline">{request.resolution}</Badge>
          <Badge variant="outline">
            <span className="tabular">
              {request.count} image{request.count === 1 ? "" : "s"}
            </span>
          </Badge>
        </>
      )}
    </div>
  );
}

/** The user's prompt - never the sample's prompt idea. */
export function PromptText({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const long = text.length > 160;

  return (
    <div>
      <p
        className={cn(
          "text-base leading-relaxed text-text",
          !expanded && long && "line-clamp-3",
        )}
      >
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-1 text-sm text-text-muted underline-offset-4 transition-colors hover:text-text hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export function FrameThumbs({ thumbs }: { thumbs: Generation["thumbs"] }) {
  const entries: { key: string; label: string; src: string }[] = [];
  if (thumbs.start) entries.push({ key: "start", label: "Start frame", src: thumbs.start });
  if (thumbs.end) entries.push({ key: "end", label: "End frame", src: thumbs.end });
  thumbs.refs.forEach((src, index) =>
    entries.push({ key: `ref-${index}`, label: `Reference ${index + 1}`, src }),
  );

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map((entry) => (
        <Tooltip key={entry.key}>
          <TooltipTrigger asChild>
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the user's own file */}
            <img
              src={entry.src}
              alt={entry.label}
              className="size-10 rounded-sm border border-border object-cover"
            />
          </TooltipTrigger>
          <TooltipContent>{entry.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

/** One line for a single result, a popover for a grid of them. */
export function SampleCredits({ sampleIds }: { sampleIds: string[] }) {
  const samples = sampleIds
    .map((id) => getSample(id))
    .filter((sample): sample is NonNullable<typeof sample> => Boolean(sample));

  if (samples.length === 0) return null;

  const link = (sample: (typeof samples)[number]) => (
    <a
      key={sample.id}
      href={sample.credit.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block underline-offset-4 transition-colors hover:text-text hover:underline"
    >
      {creditLine(sample)} · {sample.credit.license}
    </a>
  );

  if (samples.length === 1) {
    return <div className="text-sm text-text-faint">{link(samples[0])}</div>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="self-start text-left text-sm text-text-faint underline-offset-4 transition-colors hover:text-text hover:underline"
        >
          {samples.length} demo samples, see credits
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <PopoverHeader>
          <PopoverTitle>Sample credits</PopoverTitle>
        </PopoverHeader>
        <div className="space-y-1.5 px-2 pb-1.5 text-sm text-text-muted">
          {samples.map(link)}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ResultActions({
  generation,
  onRegenerate,
  onReuse,
  onDelete,
  disabled,
}: {
  generation: Generation;
  onRegenerate: () => void;
  onReuse: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generation.request.prompt);
      toast.success("Prompt copied");
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button variant="secondary" size="sm" onClick={onRegenerate} disabled={disabled}>
        <RefreshCw /> Regenerate
      </Button>
      <Button variant="secondary" size="sm" onClick={onReuse}>
        <Settings2 /> Reuse
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={copyPrompt}
        aria-label="Copy prompt"
      >
        <Copy />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        aria-label="Delete generation"
        className="hover:text-danger"
      >
        <Trash2 />
      </Button>
    </div>
  );
}

export function RetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <Button variant="secondary" size="sm" onClick={onRetry}>
      <RotateCcw /> Retry
    </Button>
  );
}

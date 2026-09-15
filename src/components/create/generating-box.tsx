"use client";

import * as React from "react";
import { cn } from "cn";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { aspectRatioCss } from "@/components/create/aspect-icon";
import type { Aspect } from "@/lib/samples";

/** Ticks once a second so "Generating 4s" counts up without a render per frame. */
export function useElapsedSeconds(since: number): number {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return Math.max(0, Math.round((now - since) / 1000));
}

/**
 * The in-progress box: a shimmer at the requested aspect with progress on top.
 *
 * It's sized from the aspect, not from the result, so nothing on the page moves
 * when the real media lands. If there's a start frame it sits behind, blurred -
 * cheap, and it makes the wait feel connected to what you asked for.
 */
export function GeneratingBox({
  aspect,
  progress,
  queued,
  since,
  backdrop,
  onCancel,
  className,
}: {
  aspect: Aspect;
  progress: number;
  queued: boolean;
  since: number;
  /** Start frame preview, if there is one. */
  backdrop?: string;
  onCancel?: () => void;
  className?: string;
}) {
  const elapsed = useElapsedSeconds(since);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-md bg-surface-2",
        className,
      )}
      style={{ aspectRatio: aspectRatioCss(aspect) }}
    >
      {backdrop ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- object/data URL, never hits the network */}
          <img
            src={backdrop}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
          />
          <div className="absolute inset-0 bg-bg/60" />
        </>
      ) : (
        <div className="va-shimmer absolute inset-0" aria-hidden="true" />
      )}

      <div className="relative flex flex-col items-center gap-2 px-4 text-center">
        <span
          className="tabular display text-2xl text-text"
          aria-hidden="true"
        >
          {progress}%
        </span>
        <span
          className="text-sm text-text-muted"
          role="status"
          aria-live="polite"
        >
          {queued ? "Queued" : "Generating"}
          <span className="tabular"> · {elapsed}s</span>
        </span>

        {/* Thin bar under the numbers - the % is the primary readout. */}
        <span
          className="mt-1 block h-1 w-32 overflow-hidden rounded-full bg-surface-3"
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full bg-accent transition-[width] duration-500 ease-[var(--ease-out-soft)]"
            style={{ width: `${progress}%` }}
          />
        </span>

        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="mt-1 bg-surface/70 backdrop-blur-sm"
          >
            <X /> Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

/** Failed and canceled share a look: muted box, the reason, one way forward. */
export function FailedBox({
  aspect,
  message,
  action,
  className,
}: {
  aspect: Aspect;
  message: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-md border border-border bg-surface-2/60 px-5 text-center",
        className,
      )}
      style={{ aspectRatio: aspectRatioCss(aspect) }}
    >
      <p className="max-w-xs text-base text-text-muted">{message}</p>
      {action}
    </div>
  );
}

"use client";

import * as React from "react";
import { cn } from "cn";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Shell for the `?media=` viewer: big media on the left, info panel on the
 * right, stacked on mobile. What actually goes in the panel is spec 04 (samples)
 * and spec 07 (generations) - this only owns the frame, the prev/next arrows
 * and the keyboard handling.
 *
 * Esc and focus trapping come from Radix Dialog. Left/right arrows are wired
 * here because Radix has no opinion about them.
 */
export function MediaDialog({
  open,
  onClose,
  onPrev,
  onNext,
  title,
  description,
  media,
  panel,
}: {
  open: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  /** Screen-reader title for the dialog. */
  title: string;
  description?: string;
  media: React.ReactNode;
  panel: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") onPrev?.();
      if (event.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onPrev, onNext]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent size="media" className="overflow-y-auto">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {description && (
          <DialogDescription className="sr-only">{description}</DialogDescription>
        )}

        <div className="grid md:grid-cols-[minmax(0,1fr)_340px]">
          <div className="relative flex min-h-0 items-center justify-center bg-black">
            {media}

            {onPrev && (
              <NavArrow side="left" onClick={onPrev} label="Previous" />
            )}
            {onNext && (
              <NavArrow side="right" onClick={onNext} label="Next" />
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-border p-5 md:border-t-0 md:border-l">
            {panel}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NavArrow({
  side,
  onClick,
  label,
}: {
  side: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 inline-flex size-9 items-center justify-center",
        "rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md",
        "transition-colors duration-150 outline-none hover:bg-black/80",
        "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      {side === "left" ? (
        <ChevronLeft className="size-5" />
      ) : (
        <ChevronRight className="size-5" />
      )}
    </button>
  );
}

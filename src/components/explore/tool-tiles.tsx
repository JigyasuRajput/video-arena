"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "cn";
import { Film, Image as ImageIcon, LayoutTemplate, Shuffle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const tileClass = cn(
  "group relative flex h-full flex-col gap-2 rounded-lg border border-border bg-surface p-4 text-left",
  "transition-colors duration-150 ease-[var(--ease-out-soft)] outline-none",
  "hover:border-border-strong hover:bg-surface-2",
  "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
);

const iconClass =
  "inline-flex size-9 items-center justify-center rounded-md bg-surface-2 text-accent [&_svg]:size-4";

export function ToolTiles() {
  const scrollToWall = () => {
    document.getElementById("wall")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section aria-label="Tools" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Link href="/create/video" className={tileClass}>
        <div className="flex items-start justify-between">
          <span className={iconClass}>
            <Film />
          </span>
          <Badge variant="accent" size="xs">
            Popular
          </Badge>
        </div>
        <h3 className="mt-1 text-lg font-semibold text-text">Video</h3>
        <p className="text-base text-text-muted">
          Prompt to clip, with frames and reference images.
        </p>
      </Link>

      <Link href="/create/image" className={tileClass}>
        <div className="flex items-start justify-between">
          <span className={iconClass}>
            <ImageIcon />
          </span>
        </div>
        <h3 className="mt-1 text-lg font-semibold text-text">Image</h3>
        <p className="text-base text-text-muted">
          Generate up to four stills at once.
        </p>
      </Link>

      <button type="button" onClick={scrollToWall} className={tileClass}>
        <div className="flex items-start justify-between">
          <span className={iconClass}>
            <Shuffle />
          </span>
        </div>
        <h3 className="mt-1 text-lg font-semibold text-text">Remix</h3>
        <p className="text-base text-text-muted">Start from any clip below.</p>
      </button>

      <Tooltip>
        <TooltipTrigger asChild>
          {/* Disabled, but still focusable so the tooltip is reachable by keyboard. */}
          <div
            role="button"
            tabIndex={0}
            aria-disabled="true"
            className={cn(tileClass, "cursor-not-allowed opacity-55 hover:border-border hover:bg-surface")}
          >
            <div className="flex items-start justify-between">
              <span className={cn(iconClass, "text-text-faint")}>
                <LayoutTemplate />
              </span>
              <Badge size="xs">Soon</Badge>
            </div>
            <h3 className="mt-1 text-lg font-semibold text-text-muted">
              Templates
            </h3>
            <p className="text-base text-text-faint">
              Drop yourself into a longer video.
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          Put yourself into longer videos. Not in this build.
        </TooltipContent>
      </Tooltip>
    </section>
  );
}

"use client";

import * as React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Explains a disabled control.
 *
 * A disabled button never fires pointer events, so it can't be a tooltip
 * trigger on its own. Wrapping it in a span works because the button also
 * carries `pointer-events: none` when disabled, which lets the events reach
 * the wrapper.
 */
export function Hint({
  text,
  wrap = false,
  children,
}: {
  text?: string;
  /** Set when the child is disabled. */
  wrap?: boolean;
  children: React.ReactElement;
}) {
  if (!text) return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {wrap ? <span className="inline-flex">{children}</span> : children}
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

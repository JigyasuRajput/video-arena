import * as React from "react";
import { cn } from "cn";

/**
 * Shimmering placeholder. `va-shimmer` carries the animated gradient and is
 * switched off under prefers-reduced-motion in globals.css.
 *
 * The class is deliberately not called `shimmer` - shadcn's base stylesheet
 * claims that name for a text shimmer and would override it.
 *
 * Pass an explicit size, or `aspect-video` etc, so the layout reserves its
 * space and nothing jumps when the real content lands.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("va-shimmer rounded-md bg-surface-2", className)}
      {...props}
    />
  );
}

export { Skeleton };

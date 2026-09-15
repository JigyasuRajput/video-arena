import { cn } from "cn";

import type { Aspect } from "@/lib/samples";

/** Pixel box each aspect is drawn as inside a 16px square. */
const SHAPES: Record<Aspect, { width: number; height: number }> = {
  "16:9": { width: 14, height: 8 },
  "9:16": { width: 8, height: 14 },
  "1:1": { width: 11, height: 11 },
  "4:5": { width: 10, height: 12.5 },
  "3:4": { width: 9.5, height: 12.5 },
};

/** The little shape next to an aspect option. Inherits currentColor. */
export function AspectIcon({ aspect, className }: { aspect: Aspect; className?: string }) {
  const shape = SHAPES[aspect];
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex size-4 shrink-0 items-center justify-center", className)}
    >
      <span
        className="rounded-[2px] border-[1.5px] border-current"
        style={{ width: shape.width, height: shape.height }}
      />
    </span>
  );
}

/** For `aspect-ratio` on the result and progress boxes. */
export function aspectRatioCss(aspect: Aspect): string {
  return aspect.replace(":", " / ");
}

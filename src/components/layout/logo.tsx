import * as React from "react";
import { cn } from "cn";

/**
 * Original mark: a hexagonal arena with a play triangle in the middle.
 * Nothing here is derived from the reference screenshots.
 *
 * Kept as a single path pair so it stays legible down to 16px (it doubles as
 * the favicon in src/app/icon.svg - update both together).
 */
function LogoGlyph({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-6", className)}
      {...props}
    >
      <path
        d="M12 1.6 21.5 7v10L12 22.4 2.5 17V7L12 1.6Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M10.1 8.3 16.4 12l-6.3 3.7V8.3Z" fill="currentColor" />
    </svg>
  );
}

type LogoProps = {
  /** Hides the wordmark, for tight mobile headers. */
  glyphOnly?: boolean;
  className?: string;
};

function Logo({ glyphOnly = false, className }: LogoProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-text", className)}
      data-slot="logo"
    >
      <LogoGlyph className="size-6 text-accent" />
      {!glyphOnly && (
        <span className="text-lg leading-none font-semibold tracking-tight lowercase">
          video arena
        </span>
      )}
      {glyphOnly && <span className="sr-only">Video Arena</span>}
    </span>
  );
}

export { Logo, LogoGlyph };

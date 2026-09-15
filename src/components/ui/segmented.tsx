"use client";

import * as React from "react";
import { cn } from "cn";

type SegmentedOption<T extends string | number> = {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Shown to screen readers when `label` is only an icon or a bare number. */
  srLabel?: string;
};

type SegmentedProps<T extends string | number> = {
  options: SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** Required unless an outer element already labels the group. */
  "aria-label"?: string;
  size?: "sm" | "md";
  className?: string;
};

/**
 * Small mutually-exclusive option sets - image count, quality, and similar.
 * For longer lists use a Chip with a popover instead.
 */
function Segmented<T extends string | number>({
  options,
  value,
  onValueChange,
  size = "md",
  className,
  ...props
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={props["aria-label"]}
      data-slot="segmented"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.srLabel}
            disabled={option.disabled}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap",
              "transition-colors duration-150 ease-[var(--ease-out-soft)] outline-none",
              "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
              "disabled:pointer-events-none disabled:opacity-40",
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-3.5",
              size === "sm" ? "h-7 min-w-7 px-2.5 text-sm" : "h-8 min-w-8 px-3 text-base",
              selected
                ? "bg-accent text-accent-fg"
                : "text-text-muted hover:bg-surface-3 hover:text-text",
            )}
          >
            {option.icon}
            <span className="tabular">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { Segmented };
export type { SegmentedOption };

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { ChevronDown } from "lucide-react";

const chipVariants = cva(
  [
    "group inline-flex shrink-0 items-center gap-2 whitespace-nowrap",
    "rounded-full border font-medium select-none",
    "transition-[background-color,border-color,color] duration-150 ease-[var(--ease-out-soft)]",
    "outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    // Radix sets data-state=open on the trigger, so an open popover lights its
    // own chip without the caller tracking state.
    "data-[state=open]:border-border-strong data-[state=open]:bg-surface-3",
  ],
  {
    variants: {
      active: {
        true: "border-accent/35 bg-accent/10 text-accent hover:bg-accent/15",
        false:
          "border-border bg-surface-2 text-text hover:border-border-strong hover:bg-surface-3",
      },
      size: {
        sm: "h-8 px-3 text-sm [&_svg]:size-3.5",
        md: "h-9 px-3.5 text-base [&_svg]:size-4",
      },
    },
    defaultVariants: { active: false, size: "md" },
  },
);

type ChipProps = React.ComponentProps<"button"> &
  VariantProps<typeof chipVariants> & {
    icon?: React.ReactNode;
    /** Renders a chevron, for chips that open a popover. */
    chevron?: boolean;
  };

/**
 * The control primitive for this app: an icon plus a value, as a pill.
 * Used instead of plain selects for duration, aspect, resolution, model etc.
 */
function Chip({
  className,
  active,
  size,
  icon,
  chevron = false,
  children,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      data-slot="chip"
      className={cn(chipVariants({ active, size }), className)}
      {...props}
    >
      {icon ? (
        <span
          className={cn(
            "inline-flex items-center transition-colors",
            active ? "text-accent" : "text-text-faint group-hover:text-text-muted",
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      {/* tabular so 8s -> 10s doesn't shift the chip width */}
      <span className="tabular">{children}</span>
      {chevron ? (
        <ChevronDown
          className={cn(
            "-mr-0.5 transition-transform duration-150 group-data-[state=open]:rotate-180",
            active ? "text-accent" : "text-text-faint",
          )}
          aria-hidden="true"
        />
      ) : null}
    </button>
  );
}

export { Chip, chipVariants };

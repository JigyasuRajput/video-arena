"use client";

import * as React from "react";
import { cn } from "cn";
import { Minus, Plus } from "lucide-react";

type StepperProps = {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Renders "1/4" rather than a bare "1". */
  showMax?: boolean;
  label: string;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
};

/** The `- 1/4 +` count control. */
function Stepper({
  value,
  onValueChange,
  min = 1,
  max = 4,
  step = 1,
  showMax = true,
  label,
  size = "md",
  disabled = false,
  className,
}: StepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const decrement = () => onValueChange(clamp(value - step));
  const increment = () => onValueChange(clamp(value + step));

  const buttonClass = cn(
    "inline-flex shrink-0 items-center justify-center rounded-full text-text-muted",
    "transition-colors duration-150 ease-[var(--ease-out-soft)] outline-none",
    "hover:bg-surface-3 hover:text-text",
    "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-30",
    size === "sm" ? "size-6 [&_svg]:size-3" : "size-7 [&_svg]:size-3.5",
  );

  return (
    <div
      data-slot="stepper"
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 p-1",
        disabled && "pointer-events-none opacity-40",
        className,
      )}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || value <= min}
        aria-label={`Decrease ${label}`}
        className={buttonClass}
      >
        <Minus />
      </button>
      {/* aria-live so the count is announced without moving focus. */}
      <span
        aria-live="polite"
        className={cn(
          "tabular min-w-9 text-center font-medium text-text",
          size === "sm" ? "text-sm" : "text-base",
        )}
      >
        {value}
        {showMax && <span className="text-text-faint">/{max}</span>}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={disabled || value >= max}
        aria-label={`Increase ${label}`}
        className={buttonClass}
      >
        <Plus />
      </button>
    </div>
  );
}

export { Stepper };

"use client";

import * as React from "react";

import { Chip } from "@/components/ui/chip";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverItem,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Hint } from "@/components/create/hint";

export type ChipOption<T extends string | number> = {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  hint?: string;
};

/**
 * A chip that opens a list of values. Duration, resolution, aspect and quality
 * are all this component with a different option list - the only thing the
 * pages supply is what the values mean.
 */
export function ChipSelect<T extends string | number>({
  title,
  icon,
  value,
  options,
  onChange,
  display,
  width = "w-44",
  size = "md",
  disabled = false,
  disabledReason,
}: {
  /** Popover heading, e.g. "Duration". */
  title: string;
  icon?: React.ReactNode;
  value: T;
  options: ChipOption<T>[];
  onChange: (value: T) => void;
  /** Chip face. Defaults to the selected option's label. */
  display?: React.ReactNode;
  width?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  disabledReason?: string;
}) {
  const selected = options.find((option) => option.value === value);
  const face = display ?? selected?.label ?? String(value);

  const trigger = (
    <Chip
      size={size}
      icon={icon}
      chevron
      disabled={disabled}
      aria-label={`${title}: ${typeof face === "string" ? face : String(value)}`}
    >
      {face}
    </Chip>
  );

  if (disabled) {
    return (
      <Hint text={disabledReason} wrap>
        {trigger}
      </Hint>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className={width}>
        <PopoverHeader>
          <PopoverTitle>{title}</PopoverTitle>
        </PopoverHeader>
        {options.map((option) => (
          <PopoverItem
            key={String(option.value)}
            selected={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.icon}
            <span className="flex-1">{option.label}</span>
            {option.hint && (
              <span className="text-sm text-text-faint">{option.hint}</span>
            )}
          </PopoverItem>
        ))}
      </PopoverContent>
    </Popover>
  );
}

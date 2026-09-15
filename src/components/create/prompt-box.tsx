"use client";

import * as React from "react";
import { cn } from "cn";

export const PROMPT_MAX = 1500;

/** The counter only appears once you're close enough for it to matter. */
const COUNTER_FROM = PROMPT_MAX - 200;

/**
 * Auto-growing prompt textarea with Cmd/Ctrl+Enter to submit.
 *
 * Shared by both create pages - only the placeholder and the row count differ.
 */
export function PromptBox({
  id,
  value,
  onChange,
  onSubmit,
  placeholder,
  label,
  rows = 3,
  maxRows = 12,
  className,
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder: string;
  /** Screen-reader label. */
  label: string;
  rows?: number;
  maxRows?: number;
  className?: string;
  autoFocus?: boolean;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  // Grow to fit, then scroll. Measuring needs the height reset first, or
  // scrollHeight only ever ratchets upwards.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const lineHeight = 20;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxRows * lineHeight + 16)}px`;
  }, [value, maxRows]);

  const remaining = PROMPT_MAX - value.length;

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        value={value}
        rows={rows}
        maxLength={PROMPT_MAX}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            onSubmit?.();
          }
        }}
        placeholder={placeholder}
        className={cn(
          "w-full resize-none bg-transparent text-lg leading-relaxed text-text",
          "placeholder:text-text-faint focus:outline-none",
        )}
      />
      {value.length >= COUNTER_FROM && (
        <span
          aria-live="polite"
          className={cn(
            "tabular pointer-events-none absolute right-1 bottom-1 text-xs",
            remaining <= 0 ? "text-danger" : "text-text-faint",
          )}
        >
          {value.length}/{PROMPT_MAX}
        </span>
      )}
    </div>
  );
}

/** The one rule for whether Generate is live. */
export function promptIsUsable(prompt: string): boolean {
  return prompt.trim().length >= 3;
}

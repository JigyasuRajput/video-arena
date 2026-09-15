"use client";

import * as React from "react";
import { cn } from "cn";
import { Switch as SwitchPrimitive } from "radix-ui";

/** Audio on/off and similar binary settings. Lime when on. */
function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent p-0.5",
        "transition-colors duration-150 ease-[var(--ease-out-soft)] outline-none",
        "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
        "data-[size=default]:h-6 data-[size=default]:w-11",
        "data-[size=sm]:h-5 data-[size=sm]:w-9",
        "data-checked:bg-accent",
        "data-unchecked:bg-surface-3 data-unchecked:hover:bg-[#2e2e35]",
        "data-disabled:cursor-not-allowed data-disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-sm ring-0",
          "transition-transform duration-150 ease-[var(--ease-out-soft)]",
          "group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-4",
          "data-unchecked:translate-x-0",
          "group-data-[size=default]/switch:data-checked:translate-x-5",
          "group-data-[size=sm]/switch:data-checked:translate-x-4",
          // Dark thumb on the lime track keeps contrast in the on state.
          "data-checked:bg-accent-fg",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };

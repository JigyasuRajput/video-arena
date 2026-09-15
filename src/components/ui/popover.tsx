"use client";

import * as React from "react";
import { cn } from "cn";
import { Popover as PopoverPrimitive } from "radix-ui";

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "start",
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 origin-(--radix-popover-content-transform-origin)",
          "rounded-lg border border-border-strong p-1.5 text-base text-text outline-hidden",
          // Blurred dark glass. The opaque fallback keeps it readable over
          // video where backdrop-filter is unsupported or disabled.
          "bg-surface-2/95 shadow-[var(--shadow-pop)] supports-[backdrop-filter]:bg-surface-2/80 supports-[backdrop-filter]:backdrop-blur-xl",
          "duration-150 ease-[var(--ease-out-soft)]",
          "data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-0.5 px-2 pt-1.5 pb-2", className)}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-title"
      className={cn(
        "text-xs font-semibold tracking-wide text-text-faint uppercase",
        className,
      )}
      {...props}
    />
  );
}

function PopoverDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="popover-description"
      className={cn("text-sm text-text-muted", className)}
      {...props}
    />
  );
}

/**
 * A selectable row inside a chip popover.
 *
 * Picking a value dismisses the popover by default - Radix won't close on a
 * plain button click, and leaving it open after a choice feels broken. Pass
 * closeOnSelect={false} for multi-select menus that should stay open.
 */
function PopoverItem({
  className,
  selected = false,
  closeOnSelect = true,
  ...props
}: React.ComponentProps<"button"> & {
  selected?: boolean;
  closeOnSelect?: boolean;
}) {
  const item = (
    <button
      type="button"
      data-slot="popover-item"
      data-selected={selected || undefined}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-base",
        "transition-colors duration-150 outline-none",
        "hover:bg-surface-3 focus-visible:bg-surface-3",
        "disabled:pointer-events-none disabled:opacity-40",
        selected ? "text-accent" : "text-text",
        className,
      )}
      {...props}
    />
  );

  return closeOnSelect ? (
    <PopoverPrimitive.Close asChild>{item}</PopoverPrimitive.Close>
  ) : (
    item
  );
}

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverItem,
  PopoverTitle,
  PopoverTrigger,
};

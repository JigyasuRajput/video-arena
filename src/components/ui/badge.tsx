import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 whitespace-nowrap rounded-full border",
    "font-medium leading-none select-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-3",
  ],
  {
    variants: {
      variant: {
        /** Default chrome badge - aspect labels, durations. */
        default: "border-border bg-surface-2 text-text-muted",
        /** Sits on top of media, so it needs to survive a bright frame. */
        overlay:
          "border-white/10 bg-black/60 text-white backdrop-blur-md supports-[backdrop-filter]:bg-black/45",
        accent: "border-transparent bg-accent text-accent-fg",
        /** Lime, but quiet - for "Simulated" where it shouldn't shout. */
        accentSoft: "border-accent/25 bg-accent/10 text-accent",
        /** Pink is reserved for tiny Top / New markers only. */
        pink: "border-transparent bg-pink text-white",
        success: "border-success/25 bg-success/10 text-success",
        danger: "border-danger/25 bg-danger/10 text-danger",
        outline: "border-border-strong bg-transparent text-text-muted",
      },
      size: {
        xs: "h-5 px-1.5 text-xs",
        sm: "h-6 px-2 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "sm" },
  },
);

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

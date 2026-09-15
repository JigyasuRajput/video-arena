import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md border font-medium select-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-[var(--ease-out-soft)]",
    "outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        // The one loud thing on the page. Inner highlight + darker bottom edge
        // give it the slightly raised feel the spec asks for.
        primary:
          "border-transparent bg-accent text-accent-fg shadow-[var(--shadow-raised)] hover:bg-accent-hover active:translate-y-px active:shadow-[var(--shadow-raised-sm)]",
        secondary:
          "border-border bg-surface-2 text-text hover:bg-surface-3 hover:border-border-strong active:translate-y-px",
        ghost:
          "border-transparent bg-transparent text-text-muted hover:bg-surface-2 hover:text-text",
        outline:
          "border-border-strong bg-transparent text-text hover:bg-surface-2 hover:border-white/25 active:translate-y-px",
      },
      size: {
        sm: "h-8 px-3 text-sm [&_svg]:size-3.5",
        md: "h-10 px-4 text-base [&_svg]:size-4",
        lg: "h-12 px-6 text-lg [&_svg]:size-[18px]",
        "icon-sm": "h-8 w-8 [&_svg]:size-3.5",
        icon: "h-10 w-10 [&_svg]:size-4",
        "icon-lg": "h-12 w-12 [&_svg]:size-[18px]",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Swaps the label for a spinner and blocks interaction. */
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  // asChild hands rendering to the caller's element, so the spinner swap would
  // fight whatever it renders. Keep the child untouched in that case.
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <button
      data-slot="button"
      data-loading={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && (
        <Loader2 className="absolute animate-spin" aria-hidden="true" />
      )}
      {/* Kept mounted so the button doesn't resize while loading. */}
      <span
        className={cn(
          "inline-flex items-center gap-2",
          loading && "invisible",
        )}
      >
        {children}
      </span>
    </button>
  );
}

export { Button, buttonVariants };

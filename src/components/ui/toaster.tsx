"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Dark themed sonner. Everything user-facing goes through toasts - copy,
 * delete, errors - so nothing in this app ever calls alert().
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      offset={16}
      toastOptions={{
        classNames: {
          toast: [
            "!rounded-md !border !border-border-strong !bg-surface-2",
            "!text-base !text-text !shadow-[var(--shadow-pop)]",
            "supports-[backdrop-filter]:!bg-surface-2/90 supports-[backdrop-filter]:!backdrop-blur-xl",
          ].join(" "),
          title: "!font-medium !text-text",
          description: "!text-sm !text-text-muted",
          actionButton:
            "!rounded-sm !bg-accent !text-accent-fg !text-sm !font-medium",
          cancelButton:
            "!rounded-sm !bg-surface-3 !text-text-muted !text-sm !font-medium",
          closeButton:
            "!border-border-strong !bg-surface-3 !text-text-muted hover:!text-text",
          success: "!text-text [&_[data-icon]]:!text-success",
          error: "!text-text [&_[data-icon]]:!text-danger",
          loading: "[&_[data-icon]]:!text-text-muted",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };

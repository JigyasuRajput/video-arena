"use client";

import * as React from "react";
import { cn } from "cn";
import { ImagePlus, X } from "lucide-react";

const DEFAULT_ACCEPT = ["image/png", "image/jpeg", "image/webp"];
const DEFAULT_MAX_MB = 10;

export { DEFAULT_ACCEPT as IMAGE_ACCEPT, DEFAULT_MAX_MB as IMAGE_MAX_MB };

/**
 * The same type/size rules this slot enforces, for callers that need a bare
 * file input instead of a drop target (the image page's `+` button).
 * Returns the message to show, or null if the file is fine.
 */
export function validateImageFile(file: File, label: string): string | null {
  if (!DEFAULT_ACCEPT.includes(file.type)) {
    return `${label}: use a PNG, JPG or WebP image.`;
  }
  if (file.size > DEFAULT_MAX_MB * 1024 * 1024) {
    return `${label}: that image is over ${DEFAULT_MAX_MB} MB.`;
  }
  return null;
}

type UploadSlotProps = {
  label: string;
  /** Object URL or data URL of the current file, if any. */
  previewUrl?: string;
  onSelect?: (file: File) => void;
  onClear?: () => void;
  /** Surfaced to the caller so it can toast. */
  onError?: (message: string) => void;
  disabled?: boolean;
  accept?: string[];
  maxSizeMb?: number;
  icon?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
};

/**
 * Dashed drop target that becomes a thumbnail once filled. Owns no file state -
 * the parent holds `previewUrl` and decides what to do with the File.
 *
 * Files never leave the browser; spec 05 keeps only a downscaled thumbnail.
 */
function UploadSlot({
  label,
  previewUrl,
  onSelect,
  onClear,
  onError,
  disabled = false,
  accept = DEFAULT_ACCEPT,
  maxSizeMb = DEFAULT_MAX_MB,
  icon,
  size = "md",
  className,
}: UploadSlotProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const handleFile = React.useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!accept.includes(file.type)) {
        onError?.(`${label}: use a PNG, JPG or WebP image.`);
        return;
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        onError?.(`${label}: that image is over ${maxSizeMb} MB.`);
        return;
      }
      onSelect?.(file);
    },
    [accept, label, maxSizeMb, onError, onSelect],
  );

  const filled = Boolean(previewUrl);

  return (
    <div
      data-slot="upload-slot"
      data-filled={filled || undefined}
      onDragOver={(event) => {
        if (disabled) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        if (disabled) return;
        event.preventDefault();
        setDragging(false);
        handleFile(event.dataTransfer.files?.[0]);
      }}
      className={cn(
        "group relative w-full overflow-hidden rounded-md",
        size === "sm" ? "h-20" : "h-28",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          // Reset so picking the same file twice still fires onChange.
          event.target.value = "";
        }}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        aria-label={filled ? `Replace ${label}` : `Add ${label}`}
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-1.5",
          "rounded-md border text-center transition-colors duration-150 ease-[var(--ease-out-soft)]",
          "outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
          "disabled:pointer-events-none disabled:opacity-40",
          filled
            ? "border-solid border-border bg-surface-2"
            : "border-dashed border-border-strong bg-surface-2/50 hover:border-white/25 hover:bg-surface-2",
          dragging && "border-solid border-accent bg-accent/10",
        )}
      >
        {filled ? (
          // Object/data URLs can't go through the next/image optimizer, and
          // these are local previews that never hit the network.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={label}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <span
              className={cn(
                "text-text-faint transition-colors group-hover:text-text-muted",
                "[&_svg]:size-5",
                dragging && "text-accent",
              )}
              aria-hidden="true"
            >
              {icon ?? <ImagePlus />}
            </span>
            <span className="px-2 text-sm leading-tight text-text-muted">
              {label}
            </span>
          </>
        )}
      </button>

      {filled && !disabled && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Remove ${label}`}
          className={cn(
            "absolute top-1.5 right-1.5 inline-flex size-6 items-center justify-center",
            "rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md",
            "transition-colors duration-150 outline-none hover:bg-black/80",
            "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
          )}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export { UploadSlot };

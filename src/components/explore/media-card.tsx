"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";
import { Shuffle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { usePrefersReducedMotion } from "@/components/explore/use-reduced-motion";
import { registerVideo, setVideoVisible } from "@/components/explore/playback-manager";
import { DARK_PLACEHOLDER } from "@/lib/placeholder";
import type { Sample } from "@/lib/samples";

export function MediaCard({
  sample,
  onOpen,
  priority = false,
}: {
  sample: Sample;
  onOpen: (id: string) => void;
  /** First screenful only - everything else lazy-loads. */
  priority?: boolean;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const isVideo = sample.kind === "video";

  // Register with the playback manager and report visibility. Under reduced
  // motion we skip all of it and play on hover instead.
  React.useEffect(() => {
    const el = videoRef.current;
    const card = cardRef.current;
    if (!isVideo || !el || !card || reducedMotion) return;

    const unregister = registerVideo(sample.id, el);
    const observer = new IntersectionObserver(
      ([entry]) => setVideoVisible(sample.id, entry.intersectionRatio >= 0.5),
      { threshold: [0, 0.5, 1] },
    );
    observer.observe(card);

    return () => {
      observer.disconnect();
      setVideoVisible(sample.id, false);
      unregister();
    };
  }, [isVideo, sample.id, reducedMotion]);

  const remixHref =
    sample.kind === "video"
      ? `/create/video?remix=${sample.id}`
      : `/create/image?remix=${sample.id}`;

  const poster = isVideo ? sample.poster : sample.src;

  return (
    <div
      ref={cardRef}
      className="group relative mb-2 break-inside-avoid overflow-hidden rounded-lg bg-surface-2"
      // Reserving the exact ratio is what stops the masonry reflowing as
      // images arrive.
      style={{ aspectRatio: `${sample.width} / ${sample.height}` }}
      onMouseEnter={() => {
        if (reducedMotion && isVideo) void videoRef.current?.play().catch(() => {});
      }}
      onMouseLeave={() => {
        if (reducedMotion && isVideo) videoRef.current?.pause();
      }}
    >
      {/* Whole-card click target. Sits under the Remix button in z-order. */}
      <button
        type="button"
        onClick={() => onOpen(sample.id)}
        aria-label={`Open ${sample.prompt.slice(0, 80)}`}
        className={cn(
          "absolute inset-0 z-10 h-full w-full cursor-pointer outline-none",
          "focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2",
        )}
      />

      {poster && (
        <Image
          src={poster}
          alt={sample.prompt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1400px) 25vw, 20vw"
          priority={priority}
          // Without an explicit placeholder the browser can paint the img box
          // white before the pixels arrive. Solid --surface-2 keeps the card
          // the same colour the whole way through.
          placeholder="blur"
          blurDataURL={DARK_PLACEHOLDER}
          className="bg-surface-2 object-cover"
        />
      )}

      {isVideo && (
        <video
          ref={videoRef}
          src={sample.src}
          poster={sample.poster}
          muted
          loop
          playsInline
          preload="none"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full bg-surface-2 object-cover opacity-0 transition-opacity duration-300 data-[playing=true]:opacity-100"
          onPlaying={(event) =>
            event.currentTarget.setAttribute("data-playing", "true")
          }
          onPause={(event) =>
            event.currentTarget.setAttribute("data-playing", "false")
          }
        />
      )}

      {/* Hover ring, drawn over the media but under the controls. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-20 rounded-lg ring-1 ring-transparent transition-[box-shadow,ring-color] duration-150",
          "group-hover:ring-border-strong",
        )}
      />

      {/* Bottom gradient: always on for touch, hover-revealed on desktop. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-20 p-2.5",
          "bg-gradient-to-t from-black/85 via-black/45 to-transparent pt-10",
          "opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100",
        )}
      >
        {/* Aspect only. Every card saying "Demo sample" was the same sentence
            two dozen times over; the Demo build pill in the nav covers it. */}
        <div className="mb-1.5 hidden flex-wrap items-center gap-1 md:flex">
          <Badge variant="overlay" size="xs">
            {sample.aspect}
          </Badge>
        </div>
        <p className="line-clamp-2 text-xs leading-snug text-white/90 md:text-sm">
          {sample.prompt}
        </p>
      </div>

      <Link
        href={remixHref}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "absolute right-2 bottom-2 z-30 inline-flex items-center gap-1.5 rounded-full",
          "border border-white/15 bg-black/65 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md",
          "transition-colors duration-150 outline-none hover:bg-accent hover:text-accent-fg",
          "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
          "md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100",
        )}
      >
        <Shuffle className="size-3" aria-hidden="true" />
        Remix
      </Link>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { MediaCard } from "@/components/explore/media-card";
import { SampleMediaDialog } from "@/components/explore/sample-media-dialog";
import { startPlaybackWatcher } from "@/components/explore/playback-manager";
import { useMediaParam } from "@/components/media/use-media-param";
import type { Sample, SampleCategory } from "@/lib/samples";

const CATEGORIES: { value: SampleCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "cinematic", label: "Cinematic" },
  { value: "people", label: "People" },
  { value: "nature", label: "Nature" },
  { value: "product", label: "Product" },
  { value: "abstract", label: "Abstract" },
  { value: "motion", label: "Motion" },
];

export function MediaWall({ samples }: { samples: Sample[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { mediaId, openMedia, closeMedia } = useMediaParam();

  const category = (searchParams.get("cat") ?? "all") as SampleCategory | "all";

  React.useEffect(() => startPlaybackWatcher(), []);

  const filtered = React.useMemo(
    () =>
      category === "all"
        ? samples
        : samples.filter((sample) => sample.category === category),
    [samples, category],
  );

  const setCategory = (next: SampleCategory | "all") => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("cat");
    else params.set("cat", next);
    params.delete("media");
    const query = params.toString();
    // replace, not push - filtering shouldn't fill up the back button.
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // Prev/next step through the *filtered* list, so arrows match what's on screen.
  const index = filtered.findIndex((sample) => sample.id === mediaId);
  const current = index >= 0 ? filtered[index] : undefined;
  const step = (delta: number) => {
    if (filtered.length === 0) return;
    const next = filtered[(index + delta + filtered.length) % filtered.length];
    if (next) openMedia(next.id);
  };

  return (
    <section id="wall" className="scroll-mt-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="display text-2xl text-accent sm:text-3xl">Trending</h2>
          <p className="mt-2 text-lg text-text-muted">
            Every clip here is a free stock sample. Open one, then remix it into
            your own shot.
          </p>
        </div>
        <Button asChild variant="primary" className="shrink-0">
          <Link href="/create/video">Create</Link>
        </Button>
      </div>

      <div
        className="mt-6 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter by category"
      >
        {CATEGORIES.map((option) => {
          const active = option.value === category;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(option.value)}
              className={cn(
                "inline-flex h-8 items-center rounded-full border px-3.5 text-base font-medium",
                "transition-colors duration-150 ease-[var(--ease-out-soft)] outline-none",
                "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
                active
                  ? "border-transparent bg-accent text-accent-fg"
                  : "border-border bg-surface-2 text-text-muted hover:border-border-strong hover:bg-surface-3 hover:text-text",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-lg text-text-muted">
          Nothing in this category yet.
        </p>
      ) : (
        // CSS columns masonry. Each card carries its own aspect ratio so the
        // grid never reflows as media loads.
        <div className="mt-6 columns-2 gap-2 md:columns-3 lg:columns-4 xl:columns-5">
          {filtered.map((sample, i) => (
            <MediaCard
              key={sample.id}
              sample={sample}
              onOpen={openMedia}
              priority={i < 4}
            />
          ))}
        </div>
      )}

      <SampleMediaDialog
        sample={current}
        onClose={closeMedia}
        onPrev={filtered.length > 1 ? () => step(-1) : undefined}
        onNext={filtered.length > 1 ? () => step(1) : undefined}
      />
    </section>
  );
}

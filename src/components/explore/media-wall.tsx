"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { MediaCard } from "@/components/explore/media-card";
import { SampleMediaDialog } from "@/components/explore/sample-media-dialog";
import { startPlaybackWatcher } from "@/components/explore/playback-manager";
import { useMediaParam } from "@/components/media/use-media-param";
import type { Sample, SampleCategory } from "@/lib/samples";

// useLayoutEffect warns when rendered on the server; pick once at module load
// so the call site itself is never conditional.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

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
  const searchParams = useSearchParams();
  const { mediaId, openMedia, closeMedia } = useMediaParam();

  /**
   * The filter is local state synced to the URL by hand.
   *
   * Going through the router - even `replace` with `scroll: false` - re-runs
   * the route and jumps the page back to the top, which is jarring when you're
   * halfway down the wall. `history.replaceState` updates the address bar
   * without any navigation at all, so the scroll position simply stays put.
   */
  const [category, setCategoryState] = React.useState<SampleCategory | "all">(
    () => (searchParams.get("cat") ?? "all") as SampleCategory | "all",
  );

  React.useEffect(() => startPlaybackWatcher(), []);

  const filtered = React.useMemo(
    () =>
      category === "all"
        ? samples
        : samples.filter((sample) => sample.category === category),
    [samples, category],
  );

  /**
   * Filtering changes how tall the page is, so even with no navigation the
   * browser clamps scrollY and the content slides under you. Anchor on the
   * filter row instead: remember where it sat in the viewport, then correct
   * scroll after the new list lays out so the chips you just clicked don't
   * move. Falls back to the browser's clamp if the page is too short.
   */
  const filterRef = React.useRef<HTMLDivElement>(null);
  const anchorRef = React.useRef<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (anchorRef.current === null) return;
    const top = filterRef.current?.getBoundingClientRect().top;
    if (top !== undefined) window.scrollBy(0, top - anchorRef.current);
    anchorRef.current = null;
  }, [category]);

  const setCategory = (next: SampleCategory | "all") => {
    anchorRef.current = filterRef.current?.getBoundingClientRect().top ?? null;
    setCategoryState(next);
    const params = new URLSearchParams(window.location.search);
    if (next === "all") params.delete("cat");
    else params.set("cat", next);
    params.delete("media");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
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
            Open any clip to see the idea behind it, then remix it into your own
            shot.
          </p>
        </div>
        <Button asChild variant="primary" className="shrink-0">
          <Link href="/create/video">Create</Link>
        </Button>
      </div>

      <div
        ref={filterRef}
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

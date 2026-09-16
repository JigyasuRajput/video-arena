"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { usePrefersReducedMotion } from "@/components/explore/use-reduced-motion";
import { GenerationMediaDialog } from "@/components/media/generation-media-dialog";
import {
  generationMediaId,
  parseGenerationMediaId,
} from "@/components/media/media-id";
import { useMediaParam } from "@/components/media/use-media-param";
import { ImageBar } from "@/components/create/image-bar";
import { ImageEmptyState } from "@/components/create/image-empty";
import { readImagePrefill } from "@/components/create/image-prefill";
import { ImageResultCard } from "@/components/create/image-result-card";
import { promptIsUsable } from "@/components/create/prompt-box";
import { useImageForm } from "@/components/create/use-image-form";
import { clearPrefillParams } from "@/components/create/video-prefill";
import { exploreOrder } from "@/lib/samples";
import { clearDraft } from "@/lib/store/draft";
import { useLibrary } from "@/lib/store/library";
import {
  useGenerationQueue,
  useGenerations,
  useJobPoller,
  useLibraryReady,
} from "@/lib/store/use-generation-queue";

const FAN_SAMPLES = exploreOrder("image").slice(0, 5);

export function ImageCreate() {
  const searchParams = useSearchParams();
  const [prefill] = React.useState(() => readImagePrefill(searchParams));

  const form = useImageForm(prefill);
  const ready = useLibraryReady();
  const generations = useGenerations("image");
  const remove = useLibrary((state) => state.remove);
  const { submit, regenerate, retry, cancel, pending } = useGenerationQueue();
  const { mediaId, openMedia, closeMedia } = useMediaParam();
  const reducedMotion = usePrefersReducedMotion();

  useJobPoller();

  React.useEffect(() => {
    clearPrefillParams();
    clearDraft();
  }, []);

  const canGenerate = promptIsUsable(form.prompt);

  /**
   * The generation this bar started, so we can empty the bar when it lands.
   *
   * Leaving the prompt sitting there after the images arrive meant Generate
   * stayed armed with the input that had just been used, and tapping it again
   * quietly produced the same four images a second time.
   */
  const startedHere = React.useRef<string | null>(null);

  const generate = React.useCallback(() => {
    if (!promptIsUsable(form.prompt)) return;
    void submit(form.toRequest(), form.thumbs).then((id) => {
      startedHere.current = id;
    });
  }, [form, submit]);

  const { prompt, setPrompt } = form;
  React.useEffect(() => {
    const id = startedHere.current;
    if (!id) return;

    const generation = generations.find((item) => item.id === id);
    // Only on the way in. A failure keeps the prompt so Retry has something to
    // retry, and a row restored from localStorage was never ours to clear.
    if (generation?.status !== "completed") return;
    startedHere.current = null;

    // If they've started typing the next one while this was running, that's
    // their text now, not the bar's leftovers.
    if (prompt.trim() === generation.request.prompt) setPrompt("");
  }, [generations, prompt, setPrompt]);

  const autostarted = React.useRef(false);
  React.useEffect(() => {
    if (!ready || autostarted.current || !prefill.autostart) return;
    autostarted.current = true;
    generate();
  }, [generate, prefill.autostart, ready]);

  // The feed reads like a chat: oldest at the top, newest just above the bar.
  const feed = React.useMemo(() => [...generations].reverse(), [generations]);

  /**
   * Follow the newest card: on the way in, and again when it lands.
   *
   * Scrolling only when the feed grew wasn't enough. A smooth scroll animates
   * toward a target measured when it starts, and at that point the new card is
   * still a shimmer with a progress row under it. By the time the images arrive
   * and the progress row goes away the page is a different height, the
   * animation has long since finished a few pixels down, and Regenerate looks
   * like it did nothing - measured 37px of a possible 361px. So it fires again
   * when the newest generation settles.
   *
   * Scrolling the window rather than the spacer into view, because the prompt
   * bar is `sticky bottom-0` and last in flow: at the document bottom it sits
   * where it belongs with the new card above it, whereas aligning a spacer to
   * the viewport bottom parks the card behind it.
   */
  const latest = feed[feed.length - 1];
  const latestId = latest?.id;
  const latestStatus = latest?.status;
  const seen = React.useRef({
    count: feed.length,
    id: latestId,
    status: latestStatus,
  });

  React.useEffect(() => {
    const grew = feed.length > seen.current.count;
    const settled =
      latestStatus === "completed" &&
      (latestId !== seen.current.id || seen.current.status !== "completed");
    seen.current = { count: feed.length, id: latestId, status: latestStatus };
    if (!grew && !settled) return;

    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [feed.length, latestId, latestStatus, reducedMotion]);

  /** One entry per tile, in the order the feed renders them. */
  const slots = React.useMemo(
    () =>
      feed
        .filter((generation) => generation.status === "completed")
        .flatMap((generation) =>
          generation.resultSampleIds.map((_, index) => ({ generation, index })),
        ),
    [feed],
  );

  const parsed = parseGenerationMediaId(mediaId);
  const openGeneration = parsed
    ? feed.find((generation) => generation.id === parsed.generationId)
    : undefined;
  const slotIndex = parsed
    ? slots.findIndex(
        (slot) =>
          slot.generation.id === parsed.generationId &&
          slot.index === parsed.index,
      )
    : -1;

  const goToSlot = (offset: number) => {
    const next = slots[slotIndex + offset];
    if (next) openMedia(generationMediaId(next.generation.id, next.index));
  };

  return (
    <main className="flex flex-1 flex-col">
      <div className="container-page flex flex-1 flex-col pt-4">
        {!ready ? (
          <div className="space-y-4">
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        ) : feed.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <ImageEmptyState samples={FAN_SAMPLES} />
          </div>
        ) : (
          <div className="space-y-4">
            {feed.map((generation) => (
              <ImageResultCard
                key={generation.id}
                generation={generation}
                onOpenMedia={(index) =>
                  openMedia(generationMediaId(generation.id, index))
                }
                onUseAsReference={form.addSampleRef}
                onCancel={() => cancel(generation.id)}
                onRetry={() => void retry(generation)}
                onRegenerate={() => void regenerate(generation)}
                onReuse={() => form.reuse(generation)}
                onDelete={() => {
                  remove(generation.id);
                  toast.success("Generation deleted");
                }}
              />
            ))}
          </div>
        )}
        <div className="h-2 shrink-0" />
      </div>

      {/* Docked, not fixed: it sits at the bottom of the viewport while there
          is scroll, and at the bottom of the content when there isn't. */}
      <div className="sticky bottom-0 z-30 bg-gradient-to-t from-bg via-bg to-transparent pt-4 pb-3">
        <div className="container-page">
          <ImageBar
            form={form}
            onGenerate={generate}
            canGenerate={canGenerate}
            pending={pending}
          />
        </div>
      </div>

      {/* The generation's own panel, not the sample one. Arrows step through
          every tile in the feed, so a grid of four walks tile to tile. */}
      <GenerationMediaDialog
        generation={openGeneration}
        index={parsed?.index ?? 0}
        onClose={closeMedia}
        onPrev={slotIndex > 0 ? () => goToSlot(-1) : undefined}
        onNext={
          slotIndex >= 0 && slotIndex < slots.length - 1
            ? () => goToSlot(1)
            : undefined
        }
        onRegenerate={(generation) => {
          closeMedia();
          void regenerate(generation);
        }}
        onReuse={(generation) => {
          closeMedia();
          form.reuse(generation);
        }}
        onDelete={(generation) => {
          closeMedia();
          remove(generation.id);
          toast.success("Generation deleted");
        }}
      />
    </main>
  );
}

export function ImageCreateSkeleton() {
  return (
    <main className="container-page flex flex-1 flex-col pt-4 pb-3">
      <div className="flex-1" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </main>
  );
}

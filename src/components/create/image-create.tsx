"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { SampleMediaDialog } from "@/components/explore/sample-media-dialog";
import { usePrefersReducedMotion } from "@/components/explore/use-reduced-motion";
import { useMediaParam } from "@/components/media/use-media-param";
import { ImageBar } from "@/components/create/image-bar";
import { ImageEmptyState } from "@/components/create/image-empty";
import { readImagePrefill } from "@/components/create/image-prefill";
import { ImageResultCard } from "@/components/create/image-result-card";
import { promptIsUsable } from "@/components/create/prompt-box";
import { useImageForm } from "@/components/create/use-image-form";
import { clearPrefillParams } from "@/components/create/video-prefill";
import { exploreOrder, getSample } from "@/lib/samples";
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

  const generate = React.useCallback(() => {
    if (!promptIsUsable(form.prompt)) return;
    void submit(form.toRequest(), form.thumbs);
  }, [form, submit]);

  const autostarted = React.useRef(false);
  React.useEffect(() => {
    if (!ready || autostarted.current || !prefill.autostart) return;
    autostarted.current = true;
    generate();
  }, [generate, prefill.autostart, ready]);

  // The feed reads like a chat: oldest at the top, newest just above the bar.
  const feed = React.useMemo(() => [...generations].reverse(), [generations]);

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const seen = React.useRef(feed.length);
  React.useEffect(() => {
    if (feed.length > seen.current) {
      bottomRef.current?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "end",
      });
    }
    seen.current = feed.length;
  }, [feed.length, reducedMotion]);

  const mediaIds = React.useMemo(
    () => feed.flatMap((generation) => generation.resultSampleIds),
    [feed],
  );
  const mediaIndex = mediaId ? mediaIds.indexOf(mediaId) : -1;

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
                onOpenMedia={openMedia}
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
        <div ref={bottomRef} className="h-2 shrink-0" />
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

      <SampleMediaDialog
        sample={mediaId ? getSample(mediaId) : undefined}
        onClose={closeMedia}
        onPrev={mediaIndex > 0 ? () => openMedia(mediaIds[mediaIndex - 1]) : undefined}
        onNext={
          mediaIndex >= 0 && mediaIndex < mediaIds.length - 1
            ? () => openMedia(mediaIds[mediaIndex + 1])
            : undefined
        }
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

"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Film } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SampleMediaDialog } from "@/components/explore/sample-media-dialog";
import { useMediaParam } from "@/components/media/use-media-param";
import { promptIsUsable } from "@/components/create/prompt-box";
import { useVideoForm } from "@/components/create/use-video-form";
import { VideoEmptyState } from "@/components/create/video-empty";
import { VideoPanel } from "@/components/create/video-panel";
import { clearPrefillParams, readVideoPrefill } from "@/components/create/video-prefill";
import { VideoResultCard } from "@/components/create/video-result-card";
import { exploreOrder, getSample } from "@/lib/samples";
import { useLibrary } from "@/lib/store/library";
import {
  useGenerationQueue,
  useGenerations,
  useJobPoller,
  useLibraryReady,
  newSeed,
} from "@/lib/store/use-generation-queue";

/** A handful of clips for the empty state, from the same ordering Explore uses. */
const STARTER_SAMPLES = exploreOrder("video").slice(0, 6);

export function VideoCreate() {
  const searchParams = useSearchParams();
  // Read once, as initial state. See readVideoPrefill for why not in an effect.
  const [prefill] = React.useState(() => readVideoPrefill(searchParams));

  const form = useVideoForm(prefill);
  const ready = useLibraryReady();
  const generations = useGenerations("video");
  const remove = useLibrary((state) => state.remove);
  const { submit, regenerate, retry, cancel, pending } = useGenerationQueue();
  const { mediaId, openMedia, closeMedia } = useMediaParam();

  useJobPoller();

  // Drop the params now they've been read, so a refresh can't autostart twice.
  React.useEffect(() => {
    clearPrefillParams();
  }, []);

  const canGenerate = promptIsUsable(form.prompt);

  const generate = React.useCallback(() => {
    if (!promptIsUsable(form.prompt)) return;
    // No seed on a first run: the same prompt should give the same clip.
    // Regenerate is what supplies a new one.
    void submit(form.toRequest(), form.thumbs);
  }, [form, submit]);

  // ?autostart=1 from the Explore hero. Waits for the store so the row isn't
  // written before rehydration replaces `items`.
  const autostarted = React.useRef(false);
  React.useEffect(() => {
    if (!ready || autostarted.current || !prefill.autostart) return;
    autostarted.current = true;
    generate();
  }, [generate, prefill.autostart, ready]);

  const mediaIds = React.useMemo(
    () => generations.flatMap((generation) => generation.resultSampleIds),
    [generations],
  );
  const mediaIndex = mediaId ? mediaIds.indexOf(mediaId) : -1;

  return (
    <>
      <main className="container-page flex-1 pt-6 pb-28 lg:pb-10">
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-[68px] lg:max-h-[calc(100vh-84px)] lg:self-start lg:overflow-y-auto lg:pr-1">
            <VideoPanel
              form={form}
              onGenerate={generate}
              canGenerate={canGenerate}
              pending={pending}
            />
          </div>

          <section aria-label="Results">
            {!ready ? (
              <div className="space-y-4">
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
            ) : generations.length === 0 ? (
              <VideoEmptyState
                samples={STARTER_SAMPLES}
                onPick={(sample) => {
                  form.setPrompt(sample.prompt);
                  toast("Prompt filled in", {
                    description: "Tweak it, then hit Generate.",
                  });
                }}
              />
            ) : (
              <div className="space-y-4">
                {generations.map((generation) => (
                  <VideoResultCard
                    key={generation.id}
                    generation={generation}
                    onOpenMedia={openMedia}
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
          </section>
        </div>
      </main>

      {/* Mobile: Generate is always reachable without scrolling back up. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 p-3 backdrop-blur-xl lg:hidden">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!canGenerate}
          loading={pending}
          onClick={generate}
        >
          <Film /> Generate
        </Button>
      </div>

      <SampleMediaDialog
        sample={mediaId ? getSample(mediaId) : undefined}
        onClose={closeMedia}
        onPrev={
          mediaIndex > 0 ? () => openMedia(mediaIds[mediaIndex - 1]) : undefined
        }
        onNext={
          mediaIndex >= 0 && mediaIndex < mediaIds.length - 1
            ? () => openMedia(mediaIds[mediaIndex + 1])
            : undefined
        }
      />
    </>
  );
}

/** Used as the Suspense fallback - useSearchParams needs a boundary. */
export function VideoCreateSkeleton() {
  return (
    <main className="container-page flex-1 pt-6 pb-10">
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Skeleton className="h-[640px] w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    </main>
  );
}

/** Regenerate keeps the settings and only moves the seed. */
export { newSeed };

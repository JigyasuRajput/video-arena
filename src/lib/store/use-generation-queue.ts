"use client";

import * as React from "react";
import { toast } from "sonner";

import { fetchJobStatus, submitGeneration } from "@/lib/generation/client";
import type { GenerationKind, GenerationRequest } from "@/lib/generation/types";
import {
  isActive,
  newGenerationId,
  useLibrary,
  type Generation,
} from "@/lib/store/library";

/**
 * Submitting and polling, shared by both create pages.
 *
 * Nothing in here knows whether it's driving video or image: a request carries
 * its own kind, the queue cap counts both, and one interval covers every active
 * job on the page regardless of type.
 */

export const MAX_IN_FLIGHT = 4;
const POLL_MS = 1500;

export type GenerationThumbs = Generation["thumbs"];

/**
 * Regenerate steps the seed; it doesn't randomise it.
 *
 * A random seed rolls dice that can land on the set you already have, and with
 * a shortlist only a handful long that happens often. Stepping means every
 * press walks one position further down the relevance order, so Regenerate
 * always returns something you haven't just seen, and the whole thing stays
 * reproducible: same prompt, same seed, same result.
 */
export function nextSeed(current?: number): number {
  return (current ?? 0) + 1;
}

/** Generations of one kind, newest first. */
export function useGenerations(kind: GenerationKind): Generation[] {
  const items = useLibrary((state) => state.items);
  return React.useMemo(
    () => items.filter((item) => item.kind === kind),
    [items, kind],
  );
}

export function useGenerationQueue() {
  const add = useLibrary((state) => state.add);
  const update = useLibrary((state) => state.update);
  const items = useLibrary((state) => state.items);
  const [pending, setPending] = React.useState(false);

  const inFlight = React.useMemo(() => items.filter(isActive).length, [items]);

  const start = React.useCallback(
    async (id: string, request: GenerationRequest) => {
      setPending(true);
      try {
        const { jobId } = await submitGeneration(request);
        update(id, { jobId });
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Couldn't start the generation.";
        update(id, { status: "failed", error: message, progress: 0 });
        toast.error("Generation rejected", { description: message });
        return false;
      } finally {
        setPending(false);
      }
    },
    [update],
  );

  /**
   * The row lands in the library before the request goes out, so the feed
   * reacts instantly and a failed POST has somewhere to show its error.
   */
  const submit = React.useCallback(
    async (
      request: GenerationRequest,
      thumbs: GenerationThumbs,
      // Returns the new row's id, so a caller can follow that one generation
      // rather than guessing which of several is theirs. null if we refused to
      // start it at all. A rejected POST still gets an id - the row exists, it
      // just lands as failed.
    ): Promise<string | null> => {
      if (useLibrary.getState().items.filter(isActive).length >= MAX_IN_FLIGHT) {
        toast("Four generations at a time", {
          description: "Wait for one of the running jobs to finish, then try again.",
        });
        return null;
      }

      const id = newGenerationId();
      add({
        id,
        kind: request.kind,
        createdAt: Date.now(),
        status: "queued",
        jobId: "",
        request,
        thumbs,
        resultSampleIds: [],
        progress: 0,
      });
      await start(id, request);
      return id;
    },
    [add, start],
  );

  /** Same settings, next seed - so the scorer walks on to the next candidates. */
  const regenerate = React.useCallback(
    (generation: Generation) =>
      submit(
        {
          ...generation.request,
          seed: nextSeed(generation.request.seed),
        } as GenerationRequest,
        generation.thumbs,
      ),
    [submit],
  );

  /** Retry reuses the row rather than stacking a second card for the same intent. */
  const retry = React.useCallback(
    async (generation: Generation) => {
      update(generation.id, {
        status: "queued",
        progress: 0,
        error: undefined,
        jobId: "",
        resultSampleIds: [],
      });
      return start(generation.id, generation.request);
    },
    [start, update],
  );

  /** Cancel only stops us listening; there is no upstream job to call off. */
  const cancel = React.useCallback(
    (id: string) => update(id, { status: "canceled" }),
    [update],
  );

  return { submit, regenerate, retry, cancel, pending, inFlight };
}

/**
 * One interval for every active job, not one per card.
 *
 * It restarts whenever the set of active job ids changes, and reads the store
 * through getState() inside the tick so a slow response can't write back stale
 * data over a cancel.
 */
export function useJobPoller() {
  const items = useLibrary((state) => state.items);
  const update = useLibrary((state) => state.update);

  const activeKey = React.useMemo(
    () =>
      items
        .filter((item) => isActive(item) && item.jobId)
        .map((item) => item.jobId)
        .sort()
        .join("|"),
    [items],
  );

  React.useEffect(() => {
    if (!activeKey) return;
    let stopped = false;

    const tick = async () => {
      const active = useLibrary
        .getState()
        .items.filter((item) => isActive(item) && item.jobId);

      await Promise.all(
        active.map(async (generation) => {
          let status;
          try {
            status = await fetchJobStatus(generation.jobId);
          } catch {
            // Transient - the next tick tries again rather than failing the job.
            return;
          }
          if (stopped) return;

          // It may have been canceled or deleted while the request was out.
          const live = useLibrary.getState().items.find((i) => i.id === generation.id);
          if (!live || !isActive(live)) return;

          if (status.status === "completed") {
            update(generation.id, {
              status: "completed",
              progress: 100,
              resultSampleIds: status.result?.sampleIds ?? [],
            });
            return;
          }
          if (status.status === "failed") {
            update(generation.id, {
              status: "failed",
              progress: status.progress,
              error: status.error ?? "Generation failed.",
            });
            return;
          }
          update(generation.id, {
            status: status.status,
            progress: status.progress,
          });
        }),
      );
    };

    void tick();
    const interval = window.setInterval(() => void tick(), POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [activeKey, update]);
}

let rehydrateStarted = false;
let blockedToasted = false;

/**
 * Rehydrate from localStorage on the client only.
 *
 * Reading it during render would make the first client paint disagree with the
 * server HTML. Callers render a skeleton until this returns true.
 */
export function useLibraryReady(): boolean {
  const hydrated = useLibrary((state) => state.hydrated);
  const storageBlocked = useLibrary((state) => state.storageBlocked);

  React.useEffect(() => {
    if (rehydrateStarted) return;
    rehydrateStarted = true;
    void Promise.resolve(useLibrary.persist.rehydrate()).finally(() => {
      // A row is written before the POST goes out, so a tab that dies in that
      // window leaves one with no job id. Nothing can ever resolve it - the
      // poller has nothing to ask about - so retire it rather than leave a
      // card stuck at "Queued 0%" forever. Retry re-submits it.
      const stranded = useLibrary
        .getState()
        .items.filter((item) => isActive(item) && !item.jobId);
      for (const item of stranded) {
        useLibrary
          .getState()
          .update(item.id, {
            status: "failed",
            error: "Interrupted before it started.",
          });
      }
      useLibrary.setState({ hydrated: true });
    });
  }, []);

  React.useEffect(() => {
    if (!storageBlocked || blockedToasted) return;
    blockedToasted = true;
    toast("Your library won't be saved", {
      description:
        "This browser is blocking local storage, so generations will be gone when you close the tab. Everything else still works.",
    });
  }, [storageBlocked]);

  return hydrated;
}

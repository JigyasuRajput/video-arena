"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { toast } from "sonner";
import { CheckSquare, FolderOpen, Search, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LibraryCard } from "@/components/library/library-card";
import { GenerationMediaDialog } from "@/components/media/generation-media-dialog";
import {
  generationMediaId,
  parseGenerationMediaId,
} from "@/components/media/media-id";
import { useMediaParam } from "@/components/media/use-media-param";
import { putDraft } from "@/lib/store/draft";
import { useLibrary, type Generation } from "@/lib/store/library";
import {
  newSeed,
  useJobPoller,
  useLibraryReady,
} from "@/lib/store/use-generation-queue";

type Tab = "all" | "video" | "image";
type Sort = "newest" | "oldest";

/** One entry per result, flattened, so prev/next walks images inside a grid. */
type Slot = { generation: Generation; index: number };

export function LibraryView() {
  const router = useRouter();
  const ready = useLibraryReady();
  const items = useLibrary((state) => state.items);
  const remove = useLibrary((state) => state.remove);
  const removeMany = useLibrary((state) => state.removeMany);
  const clearAll = useLibrary((state) => state.clear);
  const { mediaId, openMedia, closeMedia } = useMediaParam();

  // Anything still running when you land here keeps moving. The job id is self
  // contained, so this is the whole of "resume on load".
  useJobPoller();

  const [tab, setTab] = React.useState<Tab>("all");
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<Sort>("newest");
  const [selecting, setSelecting] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [confirmClear, setConfirmClear] = React.useState(false);

  // One clock for the whole grid, so twenty cards don't each hold a timer.
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const counts = React.useMemo(
    () => ({
      all: items.length,
      video: items.filter((item) => item.kind === "video").length,
      image: items.filter((item) => item.kind === "image").length,
    }),
    [items],
  );

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (tab !== "all" && item.kind !== tab) return false;
      if (!needle) return true;
      return item.request.prompt.toLowerCase().includes(needle);
    });
    // `items` is newest-first already, so oldest is just the reverse.
    return sort === "newest" ? filtered : [...filtered].reverse();
  }, [items, query, sort, tab]);

  const slots = React.useMemo<Slot[]>(
    () =>
      visible
        .filter((generation) => generation.status === "completed")
        .flatMap((generation) =>
          generation.resultSampleIds.map((_, index) => ({ generation, index })),
        ),
    [visible],
  );

  const parsed = parseGenerationMediaId(mediaId);
  const openSlot = parsed
    ? items.find((item) => item.id === parsed.generationId)
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

  /* --------------------------------------------------------------------
   * Regenerate and Reuse can't run here - the form that owns every setting
   * lives on the create page. Park the request and navigate; the page reads
   * it as its initial state.
   * ------------------------------------------------------------------ */

  const handOff = (generation: Generation, autostart: boolean) => {
    putDraft({
      // Regenerate moves the seed so the scorer's shortlist rotates to a
      // different sample. Reuse settings keeps the request exactly as it was.
      request: autostart
        ? { ...generation.request, seed: newSeed() }
        : generation.request,
      thumbs: generation.thumbs,
      autostart,
    });
    /**
     * No closeMedia() first: it calls router.back() for a param we pushed, and
     * the back and the forward navigation raced - the dialog closed and the
     * create page never opened. Navigating away drops `?media=` on its own.
     *
     * replace rather than push so Back from the create page lands on a plain
     * /library rather than reopening the dialog we just left.
     */
    router.replace(
      generation.kind === "video" ? "/create/video" : "/create/image",
    );
  };

  const deleteOne = (generation: Generation) => {
    closeMedia();
    remove(generation.id);
    toast.success("Generation deleted");
  };

  const toggleSelect = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );

  const leaveSelectMode = () => {
    setSelecting(false);
    setSelected([]);
  };

  const deleteSelected = () => {
    const count = selected.length;
    removeMany(selected);
    leaveSelectMode();
    toast.success(`${count} generation${count === 1 ? "" : "s"} deleted`);
  };

  return (
    <>
      <PageHeader
        title="Library"
        subtitle={
          ready ? (
            <>
              <span className="tabular">{counts.all}</span>
              {counts.all === 1 ? " generation" : " generations"}, saved in this
              browser only.
            </>
          ) : (
            "Saved in this browser only."
          )
        }
        action={
          ready && counts.all > 0 ? (
            selecting ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={deleteSelected}
                  disabled={selected.length === 0}
                  className="text-danger"
                >
                  <Trash2 />
                  Delete
                  {selected.length > 0 && (
                    <span className="tabular"> ({selected.length})</span>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={leaveSelectMode}>
                  <X /> Done
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelecting(true)}
                >
                  <CheckSquare /> Select
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmClear(true)}
                >
                  <Trash2 /> Clear library
                </Button>
              </div>
            )
          ) : null
        }
      />

      {!ready ? (
        <LibrarySkeleton />
      ) : counts.all === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FolderOpen />}
          title="Nothing here yet"
          description="Everything you generate lands here, and stays until you clear it or change browser."
          action={
            <>
              <Button asChild variant="primary">
                <Link href="/create/video">Create a video</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/create/image">Create an image</Link>
              </Button>
            </>
          }
        />
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Tabs
              value={tab}
              onValueChange={(value) => setTab(value as Tab)}
              className="w-fit"
            >
              <TabsList>
                <TabsTrigger value="all">
                  All <span className="tabular text-text-faint">{counts.all}</span>
                </TabsTrigger>
                <TabsTrigger value="video">
                  Videos{" "}
                  <span className="tabular text-text-faint">{counts.video}</span>
                </TabsTrigger>
                <TabsTrigger value="image">
                  Images{" "}
                  <span className="tabular text-text-faint">{counts.image}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-1 sm:flex-none">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-faint"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search prompts"
                  aria-label="Search prompts"
                  className={cn(
                    "h-9 w-full rounded-full border border-border bg-surface-2 pr-3 pl-9 text-base text-text sm:w-56",
                    "placeholder:text-text-faint",
                    "transition-colors duration-150 outline-none",
                    "hover:border-border-strong",
                    "focus-visible:border-border-strong focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
                  )}
                />
              </div>

              <Segmented
                aria-label="Sort order"
                size="sm"
                value={sort}
                onValueChange={setSort}
                options={[
                  { value: "newest", label: "Newest" },
                  { value: "oldest", label: "Oldest" },
                ]}
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              className="mt-8"
              icon={<Search />}
              title="No matches"
              description={
                query.trim()
                  ? `Nothing here mentions "${query.trim()}".`
                  : "Nothing of this kind yet."
              }
              action={
                query.trim() ? (
                  <Button variant="secondary" onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                ) : null
              }
            />
          ) : (
            // items-start: results keep their own aspect, so without it every
            // card in a row stretches to the tallest one and trails empty
            // space under its footer.
            <div className="mt-6 grid grid-cols-2 items-start gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((generation) => (
                <LibraryCard
                  key={generation.id}
                  generation={generation}
                  now={now}
                  selecting={selecting}
                  selected={selected.includes(generation.id)}
                  onToggleSelect={toggleSelect}
                  onOpen={(item, index) =>
                    openMedia(generationMediaId(item.id, index))
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      <GenerationMediaDialog
        generation={openSlot}
        index={parsed?.index ?? 0}
        onClose={closeMedia}
        onPrev={slotIndex > 0 ? () => goToSlot(-1) : undefined}
        onNext={
          slotIndex >= 0 && slotIndex < slots.length - 1
            ? () => goToSlot(1)
            : undefined
        }
        onRegenerate={(generation) => handOff(generation, true)}
        onReuse={(generation) => handOff(generation, false)}
        onDelete={deleteOne}
      />

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Clear the library?</DialogTitle>
            <DialogDescription>
              This removes all {counts.all} generations from this browser. It
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Keep them
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const count = counts.all;
                clearAll();
                leaveSelectMode();
                setConfirmClear(false);
                toast.success(`Cleared ${count} generations`);
              }}
            >
              <Trash2 /> Clear library
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LibrarySkeleton() {
  return (
    <>
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:justify-between">
        <Skeleton className="h-10 w-64 rounded-full" />
        <Skeleton className="h-9 w-72 rounded-full" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="aspect-video w-full rounded-lg" />
        ))}
      </div>
    </>
  );
}

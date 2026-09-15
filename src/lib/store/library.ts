"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import type { GenerationKind, GenerationRequest } from "@/lib/generation/types";

/**
 * The library: every generation this browser has started.
 *
 * There is no account and no server, so localStorage is the whole persistence
 * story. Spec 07 builds the /library page on top of this; specs 05 and 06 write
 * to it the moment a generation is submitted and patch it as the job moves.
 */

export const STORAGE_KEY = "va-library-v1";

/** Beyond this the oldest get dropped. Keeps us well inside a 5MB quota. */
const MAX_ITEMS = 100;

export type GenerationStatus =
  | "queued"
  | "generating"
  | "completed"
  | "failed"
  | "canceled";

export type Generation = {
  id: string;
  kind: GenerationKind;
  createdAt: number;
  status: GenerationStatus;
  /** Empty for the moment between the store write and the POST returning. */
  jobId: string;
  request: GenerationRequest;
  /** Small data URLs (or sample paths) only - never the original file. */
  thumbs: { start?: string; end?: string; refs: string[] };
  /** Empty until completed. */
  resultSampleIds: string[];
  error?: string;
  progress: number;
};

export function isActive(generation: Generation): boolean {
  return generation.status === "queued" || generation.status === "generating";
}

type LibraryState = {
  items: Generation[];
  hydrated: boolean;
  /** localStorage refused to play (private mode, quota, disabled). */
  storageBlocked: boolean;
  add: (generation: Generation) => void;
  update: (id: string, patch: Partial<Generation>) => void;
  remove: (id: string) => void;
  removeMany: (ids: string[]) => void;
  clear: () => void;
};

/* -------------------------------------------------------------------------
 * Storage that cannot throw.
 *
 * Two failure modes matter: storage being unavailable outright (Safari private
 * browsing, cookies-off), and the quota filling up as thumbnails accumulate.
 * The first falls back to memory for the session. The second sheds load - drop
 * thumbnails first, then old items - because losing a thumbnail is much better
 * than losing the whole library on the next write.
 * ---------------------------------------------------------------------- */

const memoryFallback = new Map<string, string>();
let blockedReported = false;

type PersistedShape = {
  state?: { items?: Generation[] };
};

/** Progressively smaller versions of the payload, largest first. */
function* shrink(value: string): Generator<string> {
  let parsed: PersistedShape;
  try {
    parsed = JSON.parse(value) as PersistedShape;
  } catch {
    return;
  }
  const items = parsed.state?.items;
  if (!Array.isArray(items) || items.length === 0) return;

  const withoutThumbs = (item: Generation): Generation => ({
    ...item,
    thumbs: { refs: [] },
  });
  const rebuild = (next: Generation[]) =>
    JSON.stringify({ ...parsed, state: { ...parsed.state, items: next } });

  // Items are newest-first, so the oldest live at the tail.
  const keepThumbs = Math.max(1, Math.floor(items.length / 3));
  yield rebuild(items.map((it, i) => (i < keepThumbs ? it : withoutThumbs(it))));

  const stripped = items.map(withoutThumbs);
  yield rebuild(stripped);
  yield rebuild(stripped.slice(0, Math.max(1, Math.floor(items.length / 2))));
  yield rebuild(stripped.slice(0, 10));
}

function reportBlocked() {
  if (blockedReported) return;
  blockedReported = true;
  useLibrary.setState({ storageBlocked: true });
}

const safeStorage: StateStorage = {
  getItem(name) {
    try {
      return window.localStorage.getItem(name);
    } catch {
      reportBlocked();
      return memoryFallback.get(name) ?? null;
    }
  },
  setItem(name, value) {
    try {
      window.localStorage.setItem(name, value);
      return;
    } catch {
      // Fall through and try to write less.
    }
    for (const smaller of shrink(value)) {
      try {
        window.localStorage.setItem(name, smaller);
        return;
      } catch {
        // Keep shedding.
      }
    }
    memoryFallback.set(name, value);
    reportBlocked();
  },
  removeItem(name) {
    try {
      window.localStorage.removeItem(name);
    } catch {
      memoryFallback.delete(name);
    }
  },
};

export const useLibrary = create<LibraryState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      storageBlocked: false,

      add: (generation) =>
        set((state) => ({
          items: [generation, ...state.items].slice(0, MAX_ITEMS),
        })),

      update: (id, patch) =>
        set((state) => {
          const index = state.items.findIndex((item) => item.id === id);
          if (index === -1) return state;
          const items = state.items.slice();
          items[index] = { ...items[index], ...patch };
          return { items };
        }),

      remove: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

      removeMany: (ids) =>
        set((state) => {
          const drop = new Set(ids);
          return { items: state.items.filter((item) => !drop.has(item.id)) };
        }),

      clear: () => set({ items: [] }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ items: state.items }),
      // Hydration is driven from an effect instead of running at import time,
      // so the server HTML and the first client render always agree. Callers
      // wait on `hydrated` and show a skeleton until then.
      skipHydration: true,
    },
  ),
);

export function newGenerationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `gen-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

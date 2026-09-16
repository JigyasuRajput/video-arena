"use client";

import type { GenerationKind, GenerationRequest } from "@/lib/generation/types";
import type { Generation } from "@/lib/store/library";

/**
 * A one-shot hand-off from the library to a create page.
 *
 * Regenerate and Reuse in the library dialog can't run the generation where
 * they are - the form that owns all the settings lives on the create page. So
 * they park the request here and navigate; the create page reads it as its
 * initial state and, for Regenerate, starts straight away.
 *
 * sessionStorage rather than localStorage on purpose: a draft is a hand-off
 * between two renders of the same tab and has no business outliving it, and
 * keeping it out of `va-library-v1` keeps it clear of the library's quota.
 */

const KEY = "va-draft-v1";

export type CreateDraft = {
  request: GenerationRequest;
  thumbs: Generation["thumbs"];
  /** Regenerate sets this; Reuse settings doesn't. */
  autostart: boolean;
};

export function putDraft(draft: CreateDraft): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage off. The navigation still happens, the page just opens on its
    // defaults - worth nothing more than that.
  }
}

/**
 * Read without consuming.
 *
 * Consuming here would be the obvious move, but this is called from a
 * `useState` initializer and React double-invokes those under StrictMode, so
 * the second call would find an empty slot. The page clears it from its mount
 * effect instead, which also stops a refresh replaying the draft.
 */
export function peekDraft(kind: GenerationKind): CreateDraft | null {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const draft = JSON.parse(raw) as CreateDraft;
    if (draft?.request?.kind !== kind) return null;
    return {
      request: draft.request,
      thumbs: {
        start: draft.thumbs?.start,
        end: draft.thumbs?.end,
        refs: Array.isArray(draft.thumbs?.refs) ? draft.thumbs.refs : [],
      },
      autostart: Boolean(draft.autostart),
    };
  } catch {
    clearDraft();
    return null;
  }
}

export function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear if it was never written.
  }
}

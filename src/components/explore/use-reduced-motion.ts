"use client";

import * as React from "react";

/**
 * Tracks prefers-reduced-motion. Starts false so server and first client render
 * agree, then syncs - the wall treats "unknown" as "motion allowed" and the
 * effect corrects it before anything autoplays.
 */
export function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function subscribe(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

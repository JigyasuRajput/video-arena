"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PARAM = "media";

/**
 * Drives the media viewer from `?media=<id>` so it can be linked and the back
 * button closes it.
 *
 * Closing calls `router.back()` when *we* pushed the param, so back and the
 * close button do the same thing instead of stacking history entries. When the
 * user lands directly on a `?media=` URL there is nothing to go back to, so we
 * strip the param with `replace` instead - otherwise closing would send them
 * off the site.
 */
export function useMediaParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pushedRef = React.useRef(0);

  const mediaId = searchParams.get(PARAM);

  // Read live from the address bar, not from Next's snapshot. Explore syncs its
  // category filter with history.replaceState (to avoid a scroll jump), which
  // Next's useSearchParams never sees - building from the stale snapshot would
  // silently drop ?cat= every time a card was opened.
  const currentParams = React.useCallback(
    () =>
      new URLSearchParams(
        typeof window === "undefined"
          ? searchParams.toString()
          : window.location.search,
      ),
    [searchParams],
  );

  const openMedia = React.useCallback(
    (id: string) => {
      const next = currentParams();
      next.set(PARAM, id);
      pushedRef.current += 1;
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [currentParams, pathname, router],
  );

  const closeMedia = React.useCallback(() => {
    if (pushedRef.current > 0) {
      pushedRef.current -= 1;
      router.back();
      return;
    }
    const next = currentParams();
    next.delete(PARAM);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [currentParams, pathname, router]);

  return { mediaId, openMedia, closeMedia, isOpen: Boolean(mediaId) };
}

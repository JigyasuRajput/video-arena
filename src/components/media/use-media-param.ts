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

  const openMedia = React.useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set(PARAM, id);
      pushedRef.current += 1;
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const closeMedia = React.useCallback(() => {
    if (pushedRef.current > 0) {
      pushedRef.current -= 1;
      router.back();
      return;
    }
    const next = new URLSearchParams(searchParams.toString());
    next.delete(PARAM);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  return { mediaId, openMedia, closeMedia, isOpen: Boolean(mediaId) };
}

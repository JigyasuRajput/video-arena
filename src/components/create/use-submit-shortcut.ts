"use client";

import * as React from "react";

/**
 * Cmd/Ctrl+Enter anywhere inside the panel or the bar, not just the prompt.
 *
 * Without this, tapping a chip (count, aspect) moves focus off the textarea
 * and the shortcut silently stops working - which is exactly what you do right
 * before you want to submit. PromptBox stops propagation so this can't double
 * fire.
 */
export function useSubmitShortcut(onSubmit: () => void) {
  return React.useCallback(
    (event: React.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        onSubmit();
      }
    },
    [onSubmit],
  );
}

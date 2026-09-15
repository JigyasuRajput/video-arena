"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container-page flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="display text-4xl text-accent">Oops</p>
      <h1 className="display mt-4 text-2xl">Something broke</h1>
      <p className="mt-3 max-w-sm text-lg text-text-muted">
        That wasn&apos;t meant to happen. Nothing was lost - your library lives
        in this browser.
      </p>
      {error.digest && (
        <p className="mt-2 text-sm text-text-faint">Ref: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Back to Explore</Link>
        </Button>
      </div>
    </main>
  );
}

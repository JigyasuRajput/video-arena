import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container-page flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="display text-4xl text-accent">404</p>
      <h1 className="display mt-4 text-2xl">Nothing here</h1>
      <p className="mt-3 max-w-sm text-lg text-text-muted">
        That page doesn&apos;t exist. The clip you were after might have been a
        different one.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button asChild variant="primary">
          <Link href="/">Back to Explore</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/create/video">Create a video</Link>
        </Button>
      </div>
    </main>
  );
}

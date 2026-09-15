import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen } from "lucide-react";

import { SiteFooter } from "@/components/layout/footer";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Library" };

// Spec 07 builds the real store-backed library.
export default function LibraryPage() {
  return (
    <>
      <main className="container-page flex-1 py-10">
        <PageHeader
          title="Library"
          subtitle="Saved in this browser only."
        />
        <EmptyState
          className="mt-8"
          icon={<FolderOpen />}
          title="Nothing here yet"
          description="Anything you generate shows up here. The library itself is built in spec 07."
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
      </main>
      <SiteFooter />
    </>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/footer";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { LibraryView } from "@/components/library/library-view";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <>
      <main className="container-page flex-1 py-10">
        {/* The view drives its `?media=` dialog from useSearchParams, which
            needs the boundary. */}
        <Suspense fallback={<LibraryFallback />}>
          <LibraryView />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

function LibraryFallback() {
  return (
    <>
      <PageHeader title="Library" subtitle="Saved in this browser only." />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="aspect-video w-full rounded-lg" />
        ))}
      </div>
    </>
  );
}

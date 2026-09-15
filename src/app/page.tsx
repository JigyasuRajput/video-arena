import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/footer";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ExplorePlaceholder } from "./explore-placeholder";

// The hero, tool tiles and the real masonry wall are spec 04.
export default function ExplorePage() {
  return (
    <>
      <main className="container-page flex-1 py-10">
        <PageHeader
          title="Trending"
          subtitle="The wall, the hero and the filters land in spec 04. These tiles are here to exercise the media dialog."
        />
        {/* useSearchParams needs a boundary or the whole route goes dynamic. */}
        <Suspense
          fallback={
            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="aspect-video w-full rounded-lg" />
              ))}
            </div>
          }
        >
          <ExplorePlaceholder />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

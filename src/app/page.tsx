import { Suspense } from "react";

import { SiteFooter } from "@/components/layout/footer";
import { Hero } from "@/components/explore/hero";
import { ToolTiles } from "@/components/explore/tool-tiles";
import { MediaWall } from "@/components/explore/media-wall";
import { Skeleton } from "@/components/ui/skeleton";
import { getSamples, samplesByAspect } from "@/lib/samples";

export default function ExplorePage() {
  const samples = getSamples();
  // Videos read first on the wall, then images, so it opens on motion.
  const ordered = [
    ...samples.filter((sample) => sample.kind === "video"),
    ...samples.filter((sample) => sample.kind === "image"),
  ];
  // A 16:9 clip behind the hero, dimmed and blurred.
  const backdrop = samplesByAspect("video", "16:9")[0];

  return (
    <>
      <Suspense fallback={<div className="h-[520px] border-b border-border" />}>
        <Hero backdrop={backdrop} />
      </Suspense>

      <main className="container-page flex-1 py-10">
        <ToolTiles />

        <div className="mt-14">
          <Suspense
            fallback={
              <div className="columns-2 gap-2 md:columns-3 lg:columns-4 xl:columns-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="mb-2 aspect-[9/16] w-full break-inside-avoid rounded-lg"
                  />
                ))}
              </div>
            }
          >
            <MediaWall samples={ordered} />
          </Suspense>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

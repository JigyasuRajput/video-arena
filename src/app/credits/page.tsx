import type { Metadata } from "next";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

import { SiteFooter } from "@/components/layout/footer";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { creditLine, getSamples, type Sample } from "@/lib/samples";

export const metadata: Metadata = { title: "Credits" };

function SampleRow({ sample }: { sample: Sample }) {
  // Videos show their poster; images show themselves.
  const thumb = sample.kind === "video" ? sample.poster : sample.src;

  return (
    <li className="flex items-center gap-4 border-b border-border py-3 last:border-b-0">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-surface-2">
        {thumb && (
          <Image
            src={thumb}
            alt={sample.prompt}
            fill
            sizes="64px"
            className="object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-text">
          {creditLine(sample)}
        </p>
        <p className="mt-0.5 truncate text-sm text-text-faint">
          {sample.prompt}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Badge variant="outline" size="xs">
          {sample.aspect}
        </Badge>
        <a
          href={sample.credit.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-text-muted underline-offset-4 transition-colors hover:text-text hover:underline"
        >
          Source
        </a>
        <a
          href={sample.credit.licenseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden text-sm text-text-muted underline-offset-4 transition-colors hover:text-text hover:underline sm:inline"
        >
          {sample.credit.license}
        </a>
      </div>
    </li>
  );
}

export default function CreditsPage() {
  const videos = getSamples("video");
  const images = getSamples("image");
  const total = videos.length + images.length;

  return (
    <>
      <main className="container-page flex-1 py-10">
        <PageHeader
          title="Credits"
          subtitle="Every clip and image in this demo is free stock, used under its own licence. None of it is model output."
        />

        {total === 0 ? (
          <EmptyState
            className="mt-8"
            icon={<ImageIcon />}
            title="No samples yet"
            description="Run the sample scripts to populate the library. Once it exists, every item is listed here with its author and licence."
          />
        ) : (
          <div className="mt-8 flex flex-col gap-10">
            {videos.length > 0 && (
              <section>
                <h2 className="display text-xl text-accent">
                  Videos ({videos.length})
                </h2>
                <ul className="mt-4">
                  {videos.map((sample) => (
                    <SampleRow key={sample.id} sample={sample} />
                  ))}
                </ul>
              </section>
            )}

            {images.length > 0 && (
              <section>
                <h2 className="display text-xl text-accent">
                  Images ({images.length})
                </h2>
                <ul className="mt-4">
                  {images.map((sample) => (
                    <SampleRow key={sample.id} sample={sample} />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

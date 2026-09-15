import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/footer";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { ImageIcon } from "lucide-react";

export const metadata: Metadata = { title: "Credits" };

// Spec 02 fills this with the real sample list.
export default function CreditsPage() {
  return (
    <>
      <main className="container-page flex-1 py-10">
        <PageHeader
          title="Credits"
          subtitle="Every clip and image in this demo is free stock, used under its own licence. None of it is model output."
        />
        <EmptyState
          className="mt-8"
          icon={<ImageIcon />}
          title="No samples yet"
          description="The sample library is collected in spec 02. Once it exists, every item is listed here with its author and licence."
        />
      </main>
      <SiteFooter />
    </>
  );
}

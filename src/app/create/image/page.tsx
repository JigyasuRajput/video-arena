import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Image" };

// Spec 06 builds the docked prompt bar and the image results.
export default function CreateImagePage() {
  return (
    <main className="container-page flex-1 py-10">
      <PageHeader
        title="Create image"
        subtitle="The docked prompt bar and image results land in spec 06."
      />
    </main>
  );
}

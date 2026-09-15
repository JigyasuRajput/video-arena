import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Video" };

// Spec 05 builds the panel, the model picker and the simulated generation.
export default function CreateVideoPage() {
  return (
    <main className="container-page flex-1 py-10">
      <PageHeader
        title="Create video"
        subtitle="The settings panel and simulated generation land in spec 05."
      />
    </main>
  );
}

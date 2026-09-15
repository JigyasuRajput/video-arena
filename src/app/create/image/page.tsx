import { Suspense } from "react";
import type { Metadata } from "next";

import {
  ImageCreate,
  ImageCreateSkeleton,
} from "@/components/create/image-create";

export const metadata: Metadata = { title: "Image" };

export default function CreateImagePage() {
  return (
    <Suspense fallback={<ImageCreateSkeleton />}>
      <ImageCreate />
    </Suspense>
  );
}

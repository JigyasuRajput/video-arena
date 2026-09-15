import { Suspense } from "react";
import type { Metadata } from "next";

import {
  VideoCreate,
  VideoCreateSkeleton,
} from "@/components/create/video-create";

export const metadata: Metadata = { title: "Video" };

export default function CreateVideoPage() {
  // The whole page reads ?prompt / ?remix / ?autostart, so it needs the
  // boundary useSearchParams requires. See spec 03's notes.
  return (
    <Suspense fallback={<VideoCreateSkeleton />}>
      <VideoCreate />
    </Suspense>
  );
}

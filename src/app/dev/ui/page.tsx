import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UiGallery } from "./ui-gallery";

export const metadata: Metadata = {
  title: "UI gallery",
  robots: { index: false, follow: false },
};

/**
 * Dev-only component gallery. Not linked from anywhere in the app.
 *
 * NODE_ENV is "production" while `next build` prerenders, so this route is
 * emitted as a 404 in production builds rather than shipping the gallery.
 */
export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <UiGallery />;
}

/**
 * One place for the strings that show up in metadata, the nav and the footer.
 *
 * `url` falls back to localhost so the app still builds and runs with zero env
 * vars set, which is a hard requirement for this build.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const site = {
  name: "Video Arena",
  tagline: "Make videos from a single prompt",
  description:
    "A Higgsfield style AI video and image creation UI. Generation is simulated - results come from a library of free stock clips.",
  url: siteUrl,
  repo: "https://github.com/JigyasuRajput/video-arena",
  /** Plain-words explanation of the demo, used by the nav pill and the footer. */
  demoNote:
    "Generation here is simulated. Results come from a library of free stock clips and images, nothing is sent to any model, and your library only lives in this browser.",
} as const;

export const NAV_TABS = [
  { href: "/", label: "Explore" },
  { href: "/create/video", label: "Video" },
  { href: "/create/image", label: "Image" },
  { href: "/library", label: "Library" },
] as const;

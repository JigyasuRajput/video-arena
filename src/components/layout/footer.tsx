import Link from "next/link";
import { site } from "@/lib/site";

/**
 * Small and quiet. Rendered by Explore, Library and Credits - deliberately not
 * by the create pages, where the form should own the screen.
 */
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border py-8">
      <div className="container-page flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-faint">
          {site.name}, a Higgsfield style demo built for an 8x assignment
        </p>
        <nav aria-label="Footer" className="flex items-center gap-4">
          <Link
            href="/credits"
            className="text-sm text-text-muted underline-offset-4 transition-colors hover:text-text hover:underline"
          >
            Credits
          </Link>
          <a
            href={site.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-text-muted underline-offset-4 transition-colors hover:text-text hover:underline"
          >
            GitHub repo
          </a>
        </nav>
      </div>
      <p className="container-page mt-3 text-sm text-text-faint">
        Demo samples from Pexels, see{" "}
        <Link
          href="/credits"
          className="underline-offset-4 transition-colors hover:text-text-muted hover:underline"
        >
          credits
        </Link>
        .
      </p>
    </footer>
  );
}

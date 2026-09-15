"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Info, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Logo } from "@/components/layout/logo";
import { NAV_TABS, site } from "@/lib/site";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** The "Demo build" pill. Says in plain words that nothing is real. */
function DemoBuildPill({ className }: { className?: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3",
            "text-sm font-medium text-text-muted",
            "transition-colors duration-150 outline-none",
            "hover:border-border-strong hover:bg-surface-3 hover:text-text",
            "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
            "data-[state=open]:border-border-strong data-[state=open]:bg-surface-3 data-[state=open]:text-text",
            className,
          )}
        >
          <Info className="size-3.5" aria-hidden="true" />
          Demo build
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <p className="text-base leading-relaxed text-text-muted">
          {site.demoNote}
        </p>
        <Link
          href="/credits"
          className="mt-3 inline-block text-base font-medium text-accent underline-offset-4 hover:underline"
        >
          See sample credits
        </Link>
      </PopoverContent>
    </Popover>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Create pages give the form the space, so the bar gets shorter there.
  const compact = pathname.startsWith("/create");

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-colors duration-150",
        scrolled
          ? "border-border bg-bg/80 supports-[backdrop-filter]:backdrop-blur-xl"
          : "border-transparent bg-bg",
      )}
    >
      <nav
        aria-label="Main"
        className={cn(
          "container-page flex items-center gap-4",
          compact ? "h-14" : "h-16",
        )}
      >
        <Link
          href="/"
          className="shrink-0 rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          aria-label={`${site.name} home`}
        >
          <Logo />
        </Link>

        {/* Desktop tabs */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-8 items-center rounded-full px-3 text-base font-medium",
                    "transition-colors duration-150 outline-none",
                    "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
                    active
                      ? "text-accent"
                      : "text-text-muted hover:bg-surface-2 hover:text-text",
                  )}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <DemoBuildPill className="hidden sm:inline-flex" />
          <Button asChild variant="primary" size="sm">
            <Link href="/create/video">Create</Link>
          </Button>

          {/* Mobile menu */}
          <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogPrimitive.Trigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu />
              </Button>
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay
                className={cn(
                  "fixed inset-0 z-50 bg-black/70 md:hidden",
                  "data-open:animate-in data-open:fade-in-0",
                  "data-closed:animate-out data-closed:fade-out-0",
                )}
              />
              {/* Sheet from the top, per the spec. */}
              <DialogPrimitive.Content
                className={cn(
                  "fixed inset-x-0 top-0 z-50 md:hidden",
                  "rounded-b-lg border-b border-border-strong bg-surface p-4 shadow-[var(--shadow-pop)]",
                  "duration-150 ease-[var(--ease-out-soft)] outline-none",
                  "data-open:animate-in data-open:slide-in-from-top-4 data-open:fade-in-0",
                  "data-closed:animate-out data-closed:slide-out-to-top-4 data-closed:fade-out-0",
                )}
              >
                <DialogPrimitive.Title className="sr-only">
                  Menu
                </DialogPrimitive.Title>
                <div className="flex items-center justify-between">
                  <Logo />
                  <DialogPrimitive.Close asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Close menu">
                      <X />
                    </Button>
                  </DialogPrimitive.Close>
                </div>

                <ul className="mt-4 flex flex-col">
                  {NAV_TABS.map((tab) => {
                    const active = isActive(pathname, tab.href);
                    return (
                      <li key={tab.href}>
                        <Link
                          href={tab.href}
                          aria-current={active ? "page" : undefined}
                          // Closed on click rather than in an effect watching
                          // pathname - tapping the current tab should still
                          // dismiss the sheet, and no cascading render.
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            "flex h-11 items-center rounded-md px-3 text-lg font-medium",
                            "transition-colors duration-150 outline-none",
                            "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
                            active
                              ? "text-accent"
                              : "text-text-muted hover:bg-surface-2 hover:text-text",
                          )}
                        >
                          {tab.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-text-muted">
                  {site.demoNote}{" "}
                  <Link
                    href="/credits"
                    onClick={() => setMenuOpen(false)}
                    className="font-medium text-accent underline-offset-4 hover:underline"
                  >
                    Credits
                  </Link>
                </p>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </div>
      </nav>
    </header>
  );
}

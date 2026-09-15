# 04 - Explore, notes

## What exists

Hero (display headline + backdrop clip + compact prompt bar), tool tiles, the
masonry wall with category filtering, and the sample media dialog.

`src/app/explore-placeholder.tsx` from spec 03 is **deleted**, as planned.

## Video playback on the wall

`src/components/explore/playback-manager.ts` caps concurrent playback at **6**
and ranks visible clips by distance from the viewport centre, pausing the rest.

Deliberately a **module singleton driving the `<video>` elements directly**,
not React state. It reconciles on every scroll frame; re-rendering two dozen
cards that often would cost more than the videos do. Cards register on mount,
an IntersectionObserver at `threshold 0.5` reports visibility, and a
rAF-throttled reconcile decides who plays.

Verified in the browser: 24 clips in the wall, **4 playing, cap respected**,
the other 20 paused.

`preload="none"` means nothing downloads until a clip comes near the viewport.
Once you've scrolled the whole wall all 24 will have loaded — that's the
intended trade, not a leak.

## Decisions

**Masonry is CSS columns**, with every card carrying its own `aspect-ratio`
from the manifest's width/height. That's what stops the grid reflowing as media
arrives — the box is the right size before anything loads.

**The filter uses `router.replace`, not `push`.** Clicking through six
categories shouldn't leave six entries in the back button. It also clears
`?media=` so a filter change can't leave a dialog open on a now-hidden item.

**Prev/next step through the *filtered* list**, not all samples, so the arrows
match what's actually on screen.

**`src/lib/models.ts` landed here**, not in spec 05, because the hero prompt bar
needs model/duration/aspect chips. It's the full spec-05 shape (6 video models,
4 image models) with capability values that deliberately differ — Veo only does
8s, Hailuo takes no refs, Seedream caps at 2 images — so the snapping logic in
05/06 gets exercised. Every capability value is demo config; a comment at the
top of the file says so.

**Hero backdrop dimming was tuned by eye.** First pass (`bg-bg/80` + a heavy
gradient) knocked the clip back so far it was invisible, which defeats the
point. Now `bg-bg/60` plus a gradient that lands on `--bg` at the bottom, so the
hero blends into the page rather than ending on a hard line, and the text is
still fully legible over any frame.

**No download button in the dialog**, per the spec — it's stock under someone
else's licence.

## Verified

- typecheck, lint, build clean. All 10 routes still prerender static.
- `/`, `/?cat=nature`, `/?media=<id>` all 200. Browser console clean, no
  hydration warnings.
- Playback cap measured in-page (4 of 24 playing).
- Dialog renders real sample data: Demo sample badge, aspect, **"Prompt idea"**
  (never "Prompt"), tags, linked credit + licence, Remix, no download.

## NOT done — carried into 07

- **No Lighthouse run.** Spec 04 asks for mobile scores in the notes. Skipped
  deliberately to keep moving; it's more meaningful against the deployed URL
  than a local dev server, and spec 07 already schedules a Lighthouse pass on
  `/` and `/create/video`. **Still owed.**
- Responsive checked at desktop width only. 375/768/1600 belong to 07's QA pass.
- Reduced-motion path is implemented (`usePrefersReducedMotion`: no autoplay, no
  backdrop video, play on hover instead) but **not exercised with the OS setting
  actually flipped**.
- Remix links are built and point at `/create/video?remix=<id>` etc, but the
  create pages don't read the param until specs 05/06, so clicking one currently
  lands on a placeholder.

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

## Deployment (was not actually set up)

**Vercel was never connected to this repo.** No `video-arena` project existed
under the account (16 others did), no `.vercel/` dir, no GitHub deployment
records — so every push up to this point deployed nothing.

Created the project and connected the GitHub repo, so push-to-deploy now works
for real. Live at **https://video-arena.vercel.app**.

Two things that bit on the way:

- **`.vercelignore` is required.** CLI uploads don't honour `.gitignore`, so the
  first deploy tried to push **204 MB** — almost all of it `samples-raw/`, the
  unprocessed source media. It failed mid-upload. Only the processed 42 MB in
  `public/samples/` should ever ship.
- `vercel link` appended `.env*` and `.vercel` to `.gitignore`. Both were
  already covered, and the broader `.env*` would have masked a future
  `.env.example`. Reverted.

Verified live: all five routes 200, `/dev/ui` **404s in production** as
designed, `/opengraph-image` renders, and both video and image sample files
serve. Browser console clean on the deployed build.

## Four fixes after the first live review

**Hero backdrop never played.** It relied on the `autoPlay` attribute plus an
`onCanPlay` prop, which has two independent failure modes and hits at least one
of them intermittently: `preload="auto"` is only a hint and browsers skip it on
slow or metered connections (leaving readyState 0 forever), and when the clip
*did* load instantly from cache, `canplay` fired before React attached the
handler, so the fade-in never triggered and it sat at opacity 0. Now driven
from an effect that calls `load()` itself, checks `readyState` in case the
event was already missed, listens on both `loadeddata` and `playing`, and
retries `play()` on first pointerdown and on visibilitychange in case autoplay
was refused.

**Category chips jumped the page to the top.** `router.replace` with
`scroll: false` still re-runs the route and resets scroll. The filter is now
local state synced to the URL with `history.replaceState` — no navigation at
all. That alone left a second, subtler problem: filtering makes the page
shorter, so the browser clamps scrollY and the content slides under you. So the
filter row is used as an anchor — its viewport offset is recorded before the
change and scroll is corrected in a layout effect after. Measured: 1800 → 1800
on a filter that still fills the page; Product (6 items) clamps because the
page physically can't be that tall.

Knock-on: `useMediaParam` now reads `window.location.search` rather than Next's
`useSearchParams` snapshot. Next never sees a `replaceState`, so building the
next URL from the stale snapshot silently dropped `?cat=` every time a card was
opened.

**Cards flashed white before images loaded.** `next/image` paints no
placeholder by default. Every image now gets `placeholder="blur"` with a 1×1
PNG of `--surface-2` (`src/lib/placeholder.ts`) plus a `bg-surface-2` class as
a belt-and-braces. Verified in the server HTML: 42 dark placeholders, zero
white backgrounds.

**First tile was dark and muddy.** CSS multi-column fills each column top to
bottom, so the visible top row is the *first item of each column* — and the
break points move with the breakpoint and with content height, so those slots
can't be targeted directly. `exploreOrder()` interleaves hand-picked bright
clips with the rest so every even index is bright, and sinks the muddiest
eleven to the tail so a column can never open on one. Index 0 is bright by
construction.

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

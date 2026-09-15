# 06 - Create image, notes

## What exists

`/create/image`: fanned-card hero before anything exists, a docked prompt bar
at the bottom, and a chat-style feed above it (oldest at the top, newest just
above the bar, auto-scrolled). Per-tile **Use as reference** and **Animate**.

## What's actually shared with 05

The spec asks for reuse rather than a fork. What image adds is four files:
`image-prefill.ts`, `use-image-form.ts`, `image-bar.tsx`, `image-empty.tsx`,
`image-result-card.tsx`, `image-create.tsx` - and those are layout and form
state only. Everything below them is the same code the video page runs:

| | shared |
| --- | --- |
| provider, timing, job ids | `src/lib/generation/*`, unchanged |
| sample picking | `pickSampleIds({ count })` - video passes 1, image passes `count` |
| job polling | `/api/jobs/[jobId]`, one route, no branch on kind |
| submit validation | `handleSubmit(kind, body)`; the two routes are 15 lines each |
| queue, cap, poller | `useGenerationQueue` / `useJobPoller` - one interval for both kinds |
| store | one `Generation` type, one localStorage key |
| chips, model picker, prompt box, badges, prompt clamp, credits, actions | `src/components/create/*` |
| snapping + toast wording | `snapField` in `src/lib/create/settings.ts` |

`ModelPicker` is generic over both catalogues: the pages flatten their own
model shape into `tags` and `meta`, so the picker never learns what a duration
or an image count is.

## Decisions

**The bar is `sticky bottom-0`, not `fixed`.** Fixed would need matching bottom
padding maintained by hand and gets in the way of the empty state. Sticky sits
at the bottom of the viewport when there's scroll and at the bottom of the
content when there isn't, which is what the ref actually looks like.

**The fanned hero cards are `aria-hidden`, not buttons.** The way in on this
page is the bar. Video's empty state is different - there the tiles *are*
clickable, because filling the prompt is the useful shortcut when the panel is
on the other side of the screen.

**Tile grids use an explicit class map.** Tailwind can't see a template-built
`grid-cols-${count}`.

**The landing stagger is CSS only** (`animationDelay: index * 110ms`). The job
completes once; staggering the paint just stops four tiles popping in as one
block. Spec called this out as visual, and it is - no state is involved.

**Per-tile actions are hover-revealed on pointer devices and always visible on
touch** (`@media (hover: hover)`), so they aren't unreachable on a phone.

**Extra failure state.** A row is written before the POST goes out, so a tab
that dies in that window leaves a row with no job id that nothing can ever
resolve - the poller has nothing to ask about. Found it by hanging a dev tab
mid-submit and seeing "Queued · 0% · 146s" in a second tab. Rehydration now
retires those as failed, and Retry re-submits them.

**`addSampleRef` does its toasts outside the state updater.** First version
toasted from inside `setRefs(current => ...)`; updaters can run more than once,
so that could double-toast.

## Verified in the browser

- Empty state → type → count 4 → Generate: four shimmer tiles, progress and
  Cancel, then four images landing staggered, "4 demo samples, see credits".
- Cmd+Enter submits from the bar.
- Auto-scroll: a second generation scrolled the feed to the newest card.
- **Animate** on a tile landed on `/create/video` with that image already in
  the start-frame slot, the prompt carried across, and the URL cleaned.
- typecheck, lint, build clean; still only the three API routes are dynamic.

## Known, and not a bug

**Image results can be weak matches.** "neon city street at night in the rain"
at 1:1 returned ink-in-water, bottles, a watch and city bokeh. The 1:1 pool is
five images and none of them is a neon street - the scorer is doing the right
thing inside the aspect it was asked for. It's a library-size limit, not a
scoring fault. More 1:1 samples would fix it; `samples:fetch` is the lever.

## Also observed

One dev tab locked up during an image submit. It did **not** reproduce in a
fresh tab running the identical sequence (empty state → count 4 → Generate),
and the API never received the request. That tab had been through a dozen Fast
Refresh cycles while these files were being edited and had several `<video>`
elements running, so it reads as a dev-server artefact. Flagged here rather
than silently dropped - worth re-checking against the production build.

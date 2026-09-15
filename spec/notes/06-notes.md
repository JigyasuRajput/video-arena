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

## The picker got fixed on the way through

Live testing showed results that didn't match the prompt at all - "waves
crashing on a rocky coast" came back as a night-time car interior, "ocean waves
in slow motion" as ink-in-water. Three faults, all in `pick.ts`:

1. **Zero-scoring samples sat in the top three** and a flat `hash % length`
   gave them the same odds as a real match. Now a sample with no overlap only
   appears if an image grid would otherwise be short, and it sorts last.
2. **The hash overruled the score.** It now only breaks ties between samples at
   the *best* score. Regenerate still varies - ties are common at this library
   size, verified with four seeds giving two different clips - but a clear best
   match wins every time, which is the right answer rather than a missing
   feature.
3. **No stemming**, so "waves" missed "wave" and "dunes" missed "dune". There's
   a crude suffix trim now, applied to both sides with a 4-character floor.

After: mountain lake → drone-mountain-ridge, rocky coast → coast-cliffs-aerial,
city traffic → city-traffic-timelapse, snow/pines → snow-falling-pines, desert
dunes → desert-dunes-wind, dancer/red light → dancer-silhouette, ocean waves →
ocean-waves-vertical, fireworks → fireworks-night-sky.

**What remains is a library limit, not a scoring one.** At 1:1 the desert prompt
still returns coffee/bokeh/ink, because there is no desert square among the five
1:1 images - the same prompt at 16:9 correctly leads with `img-desert-figure`.
Aspect is a hard filter by spec, so the fix is more square samples;
`samples:fetch` is the lever.

**Cmd+Enter now works from the whole panel/bar**, not just the textarea. Tapping
a chip moved focus off the prompt and silently killed the shortcut, which is
exactly when you want it. `PromptBox` stops propagation so it can't fire twice.

## Also observed

One dev tab locked up during an image submit. It did **not** reproduce in a
fresh tab running the identical sequence (empty state → count 4 → Generate),
and the API never received the request. That tab had been through a dozen Fast
Refresh cycles while these files were being edited and had several `<video>`
elements running, so it reads as a dev-server artefact. Flagged here rather
than silently dropped - worth re-checking against the production build.

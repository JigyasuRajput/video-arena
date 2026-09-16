# 07 - Library, polish, deploy, notes

Last spec. Also the round where four things from a live review got fixed.

## What exists

`/library`: tabs with counts, prompt search, newest/oldest, a grid of cards,
select mode with multi delete, Clear library behind a confirm, and the `?media=`
dialog. The store was already built in spec 05 and only needed the page.

New: `src/components/library/*`, `src/components/media/generation-media-dialog.tsx`,
`src/components/media/media-id.ts`, `src/lib/store/draft.ts`,
`src/lib/relative-time.ts`.

## Decisions

**Library cards use a uniform 4:5 tile, not each result's own aspect.** First
pass used the real ratios and the grid came out exactly as ragged as spec 05's
video empty state did for the same reason: a 9:16 result is twice the height of
the 16:9 one beside it, the row takes the tallest, and every other card trails
empty space under its footer. The aspect is still on the card as a badge, and
the dialog shows the result at its real shape.

**Library video results only play on hover.** Explore needs a playback manager
because two dozen clips autoplay there. Here nothing plays on its own, so the
card just calls `play()` on pointerenter and there's nothing to coordinate.

**`?media=` for a generation can't be a bare sample id.** Two generations from
the same prompt come back with the same sample, so `indexOf` found the wrong one:
prev/next jumped to the other card and the panel showed another generation's
settings. Ids are now `<generationId>~<index>` (`~` appears in neither a uuid nor
a kebab-case sample id). Explore still uses a bare sample id, which is fine there
because a sample is on the wall once.

**Regenerate and Reuse from the library hand off through a draft.** They can't
run where they are: the form that owns every setting lives on the create page.
So they park the request in sessionStorage and navigate, and the create page
reads it as its initial state the same way it reads `?remix=`. sessionStorage,
not localStorage, because a hand-off has no business outliving the tab, and it
stays clear of the library's quota.

`peekDraft`, not `takeDraft`. Consuming on read is the obvious move and it's
wrong here: it's called from a `useState` initializer and React double-invokes
those under StrictMode, so the second call would find an empty slot. The page
clears it from its mount effect instead, alongside `clearPrefillParams()`, which
also stops a refresh replaying the draft.

**Regenerate closed the dialog and went nowhere.** `closeMedia()` calls
`router.back()` for a param we pushed, and that raced the forward navigation.
Navigating away drops `?media=` by itself, so the close is gone. It also
`replace`s rather than `push`es, so Back from the create page lands on a plain
`/library` rather than reopening the dialog you just left.

## The generation panel (part 2)

Both create pages were still handing results to `SampleMediaDialog`, which
describes a stock clip: author, licence, "Prompt idea". None of that is right for
something the user asked for. There's now one `GenerationMediaDialog` shared by
`/create/video`, `/create/image` and `/library`: Simulated, the requested model
and every setting, the prompt as typed, the frame thumbs, and Regenerate / Reuse
settings / Copy prompt / Delete.

Media is framed at the aspect that was *asked for* with the sample covering it,
so the dialog shows what was clicked rather than re-framing it.

## Aspect was the reason results didn't match (part 3)

This was the big one. Aspect was a hard filter, so "woman dancing under a red
light" at 16:9 returned a car interior: the dancer clip is 9:16 and was never a
candidate. Ten videos per aspect is narrow enough that plenty of prompts have no
good answer inside the one you picked.

Aspect is now a **tiebreaker**, not a filter. Scoring runs over the whole library
and sorts on score first, aspect second. A like-for-like match in the requested
aspect still wins; a better match from another aspect wins outright and renders
object-cover in the requested aspect box, which the cards and dialog already did.

This is slightly broader than the instruction, which was "if nothing in the
requested aspect matches any prompt words". That rule is a subset of this one,
and the extra cases are the good ones - see the list below.

Second fault, found while testing the first: **the stemmer only trims
`ing|es|s`**, so "dancing" became "danc" while "dance" and "dancer" stayed put
and the three never met. The dancer clip scored no better than a car interior
because the only word either matched was "light". One side being a prefix of the
other now counts, with a four-character floor so "car" and "cat" can't collide.

Answers that were previously impossible, all verified: fireworks, skate street
run, neon street rain, waterfall, rain-on-glass at 1:1, and the desert image at
1:1 - the exact case spec 06's notes wrote off as "a library limit, not a scoring
one". It was a scoring one.

**Tried and reverted: weighting words by rarity.** It reads well in theory -
"dancing" is in one clip, "light" is in a third of the library, so they shouldn't
count the same. In practice a prompt's rarest words are usually its *style*, not
its subject: "drone flying over snowy mountain ridges at golden hour" started
returning the desert clip because "golden" and "hour" are rarer than "drone" and
"mountain". Flat counting gets the subject right, which matters more. The
reasoning is in `pick.ts` so it doesn't get re-tried.

**Still imperfect, honestly:** "woman dancing under a red light" now leads with
`portrait-wind-hair` rather than `dancer-silhouette`. Those two are a genuine
tie - the portrait matches `woman` + `light`, the dancer matches `danc` + `light`,
two words each, and nothing in the scorer can separate them without inventing a
rule about word order. Both are 9:16 clips that relate to the prompt, and
Regenerate flips between them. The car interior is gone, which was the actual
complaint.

## Declutter (part 4)

A single image result carried a Simulated chip, a "4 demo samples, see credits"
line, and sat under a footer that also said "Demo samples from Pexels, see
credits". Three restatements of one fact on one screen, with every Explore card
saying "Demo sample" on top of that.

Removed: per-item credit lines everywhere, the "Demo sample" badge everywhere,
the footer's second credits sentence. Kept: `/credits`, the footer's Credits
link, the Demo build pill and popover, and exactly one Simulated chip on
generated results.

Also rewrote the Explore hero subtitle to describe the product, and the wall
subtitle for the same reason - it still said "Every clip here is a free stock
sample", which is the same noise one heading lower.

No em dashes left in any UI copy, including `/dev/ui`.

## Fanned cards on the empty image page

**I could not reproduce blank cards.** Checked local and live, Chrome, at 1288px,
495px and a forced 375px layout, on hard load and on client-side navigation from
Explore - the fan rendered every time.

What I did find and fix, both of which would produce exactly that symptom on a
slower connection than mine:

- The images were **lazy**, so they sat behind an intersection check while being
  the first thing on the page. With the dark blur placeholder underneath, five
  unloaded cards read as five empty boxes rather than as loading. They're
  `priority` now.
- `sizes="140px"` asked the optimiser for an asset narrower than the card
  actually is (128px at a 2x DPR), so the fan came back soft.

Flagging it rather than calling it fixed, because I never saw the failure.

## Pexels only

`spec/notes/02-notes.md` recorded that Mixkit was dropped, but the README still
said "Pexels and Mixkit" and the `SampleCredit["source"]` union still allowed
`"Mixkit"` for a value nothing produces and `/credits` can never show. Narrowed
the type, corrected the README.

`spec/02-sample-library.md` and `spec/03-app-shell.md` keep their original
wording. They're the brief as written; the notes are where deviations belong, and
editing a spec after the fact to match what happened defeats the point of having
both.

## Verified on the live build

Full walkthrough on `https://video-arena.vercel.app` in a cleared browser:

- Explore → open the dancer clip → Remix → prompt, 9:16, 10s and the poster all
  carried, URL cleaned to `/create/video`.
- Generate → 35% with the start frame blurred behind it → **refreshed
  mid-generation** → came back completed, restored from localStorage, and the
  result matched the prompt (the dancer clip, at 9:16).
- Library → the generation is there.
- Image → 4 up → four tiles landed, `img-mountain-lake` leading, borrowed from
  3:4 and covering the 1:1 box.
- **Animate** on a tile → `/create/video` with that image in the start frame slot
  and the prompt carried.
- Library again → both generations, correct kinds, counts and relative times.
- All five routes 200, `/dev/ui` **404s**.
- **Console clean** on `/`, `/library` and `/create/image` on the deployed build.
- **375px:** measured zero overflowing elements on `/`, `/library`,
  `/create/video` and `/create/image`. Chrome won't size a window below ~495px,
  so this was done by forcing a 375px layout width, which is sound here because
  375 and 495 are in the same Tailwind band and so resolve the same classes.
- **Touch without hover:** the per-tile action row's only opacity rules live
  inside `[@media(hover:hover)]`, with no base `opacity-0`, so a `hover: none`
  device renders them visible. Explore's Remix button measured `opacity: 1`
  below `md` with no pointer over it.

## Three more from a second live review

**The image bar kept the prompt after the results landed.** Generate stayed
armed with the input that had just been used, so tapping it again quietly made
the same set a second time. The bar now empties when the generation *it* started
completes - tracked by id, so a row restored from localStorage or someone else's
generation can't clear it, and only on `completed`, so a failure keeps the prompt
for Retry. If you've started typing the next one while it was running, that text
is yours and stays. Video keeps its prompt on purpose: that's a standing panel,
not a chat bar.

**Regenerate returned the identical set.** The seed went into the hash and the
lead was drawn `% tied`, so a prompt with one clear best match had `tied === 1`
and the seed changed nothing at all: "a mountain lake at dawn" regenerated to the
same four images forever. A dead button that looked like a working one.

Two changes. The non-matching tail is no longer dropped from the ranked list, so
there's somewhere to rotate to. And the seed is a step count (Regenerate
increments it rather than randomising it) applied as an *offset from* the first
run's lead, stepping by `count`:

- offset, not an independent draw, because an independent draw could land back
  on the result you already had - measured it doing exactly that, seed 1 and the
  unseeded run both returning `drone-mountain-ridge`.
- by `count`, not by 1, so a grid of four comes back as four new images rather
  than the same three plus one.

Results stay on prompt because the list is ordered by relevance: these are the
next best matches. "waves crashing on a rocky coast" now walks
coast-cliffs-aerial → ocean-slow-motion → ocean-waves-vertical →
waterfall-forest-drop. Every first-run result is unchanged.

**Regenerate didn't scroll to the new card.** The feed-grew effect did fire, but
a smooth scroll animates toward a target measured when it starts, and at that
point the new card is still a shimmer with a progress row under it. The page then
grows, the animation has already finished a few pixels down, and Regenerate looks
like it did nothing: measured **37px of a possible 361px**. It now also fires
when the newest generation settles, which corrects for the height change, and it
scrolls the window rather than a spacer into view - the prompt bar is
`sticky bottom-0` and last in flow, so the document bottom is exactly where the
new card sits above it, whereas aligning a spacer to the viewport bottom parks
the card behind the bar. Measured after: top → 1354 of max 1353 on submit, 1310
of 1309 once complete.

Worth knowing for anyone testing this the same way: **Chrome does not animate
`behavior: "smooth"` in a tab that isn't foregrounded**, so scroll assertions
through browser automation silently read as "didn't scroll". The behaviour above
was verified by temporarily forcing instant scrolling, then restored.

## Not done

- **No Lighthouse run.** Skipped on instruction. Owed since spec 04.
- **Safari untested.** Skipped on instruction. Video autoplay is the usual thing
  that breaks there and the result cards already call `play()` explicitly for it,
  but nobody has actually looked.
- **Reduced motion** is implemented throughout and still has not been exercised
  with the OS setting flipped.
- Touch behaviour was verified from the CSS, not on a real phone.

# Video Arena

**Live: https://video-arena.vercel.app**

A Higgsfield style AI video and image creation UI, built as a Next.js app for
the 8x "Clone Higgsfield" assignment. Browse an explore wall, open a clip, remix
it into a prompt, generate a video or a set of images, and keep everything in a
library that survives a refresh.

No sign-in. Nothing to configure. It works in an incognito window.

## What's real and what's simulated

**Real:** the whole product surface, and everything behind it up to the model
call. The form state and the capability rules (Veo only does 8s, Hailuo takes no
reference images, Seedream caps at 2 images, and the UI snaps your settings and
tells you what it moved). Submission through an API route with two layers of
validation. A job queue capped at four in flight, polled from one interval.
Progress, cancel, failure, retry. The library in localStorage, with quota
handling. Deep links, the media dialog, keyboard handling, reduced motion,
responsive layouts.

**Simulated:** the generation itself. No model is ever called. A request is
scored against a library of 41 free Pexels clips and images and comes back with
whichever one best matches your prompt, after a realistic delay with an eased
progress curve. Every generated result is labelled **Simulated** in the UI.

**Why.** Three reasons, in order of weight:

1. **I wanted the time to go on UX.** This is a clone-the-product assignment.
   The interesting problems are the ones above the API call: what the form does
   when you switch to a model that can't do what you asked, what the page looks
   like for the fifteen seconds you're waiting, what happens when you refresh
   mid-generation. Wiring a real provider is a day of plumbing that demonstrates
   none of that.
2. **Cost.** A few seconds of video from a current model costs on the order of a
   dollar or more. A reviewer clicking through this for ten minutes would run up
   a real bill, and I'd have had to put it behind a key and a rate limit, which
   makes it worse to review, not better.
3. **Time box.** The build was scoped into eight specs over a fixed window.
   Something had to be the seam, and this was the cheapest one to fake and the
   easiest to make real later.

The fake provider sits behind a `GenerationProvider` interface
(`src/lib/generation/types.ts`) with two methods, `submit` and `status`. Nothing
that calls it knows it's fake. Swapping in a real backend means writing one more
implementation of that interface.

Job ids carry their own state: `base64url(payload).HMAC`, holding the kind, the
chosen sample ids, the created-at and the ETA. There is no server-side store, so
a job survives a cold function instance *and* a page refresh by the same
mechanism. That's why "refresh mid-generation" needed no extra code.

## What I left out on purpose

- **Auth.** No accounts, no sessions. The library is per browser.
- **Payments and credits.** No balance, no paywall, no "you have 40 credits
  left". It would have been a plausible-looking number with nothing behind it.
- **Real model calls.** See above.
- **Templates, avatars, face swap.** Higgsfield's "put yourself in the video"
  flow is arguably its most distinctive feature, and it's the one that needs
  real generation to mean anything. A mocked face swap would be a lie rather
  than a demo.

Everything left out is left out whole. There are no dead buttons.

## What I'd build next, in order

1. **Real generation** through OpenRouter behind the same `GenerationProvider`
   interface. No caller changes, one new file, plus a queue that survives longer
   than a function invocation.
2. **Auth and a server-side library**, so generations follow you between
   browsers instead of living in localStorage.
3. **Credits**, which only becomes meaningful once 1 and 2 exist and a
   generation actually costs something.
4. **Templates and avatars** - the "put yourself in the video" idea. Last,
   because it needs all three above to be real.

## Running it

```bash
bun install
bun dev
```

No environment variables are needed. `JOB_SECRET` is optional and falls back to
a development value; set it in production if you like. `PEXELS_API_KEY` is only
for the local sample-fetching script and is not needed to run the app.

| Script | What it does |
| --- | --- |
| `bun dev` | dev server |
| `bun run build` | production build |
| `bun run start` | serve the production build |
| `bun run lint` | eslint |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run samples:fetch` | pull candidate clips from the Pexels API |
| `bun run samples:prepare` | transcode and crop the raw downloads with ffmpeg |
| `bun run samples:check` | verify the sample manifest against what's on disk |

The three `samples:*` scripts are only needed to rebuild the sample library.
What they produce is committed, so a fresh clone runs without them.

## Samples and credits

All 41 samples are free stock from **Pexels**, used under the Pexels License.
Spec 02 also planned to source from Mixkit; that was dropped to save time and
nothing in the build uses it. Every file is listed with its author, a link to
its page and its licence at [`/credits`](https://video-arena.vercel.app/credits).

There's no download button anywhere in the app, deliberately: it's someone
else's stock under someone else's licence.

## How this repo is organised

`spec/` holds the build specs, worked in order:

| | |
| --- | --- |
| `00-project-setup.md` | Next.js, Tailwind, tooling |
| `01-design-system.md` | tokens, primitives, `/dev/ui` gallery |
| `02-sample-library.md` | fetching, cropping and describing the stock samples |
| `03-app-shell.md` | nav, footer, routes, metadata |
| `04-explore.md` | hero, tool tiles, the masonry wall, the media dialog |
| `05-create-video.md` | the video page, the fake provider, jobs, the store |
| `06-create-image.md` | the image page, shared with 05 rather than forked |
| `07-library-polish-deploy.md` | the library, the polish pass, deploy |

`spec/notes/` has one file per spec, written after finishing it: what got built,
the decisions and why, what was verified in a browser, and what was knowingly
left undone and carried forward. The notes are the honest record - where
something in a spec turned out to be wrong, the note says so rather than the
spec being quietly edited.

Specs in `/spec` were drafted with Claude from my notes and edited by me, build
sessions are in `.agent-logs`.

`.agent-logs/` is the prompt and response capture from those sessions, committed
on purpose so the process is reviewable alongside the result.

# Video Arena

A Higgsfield style AI video and image creation UI, built as a Next.js app for
the 8x "Clone Higgsfield" assignment.

**Generation is simulated.** No model is ever called. Results come from a small
library of free stock clips and images from Pexels and Mixkit, and every result
in the UI is labelled as a demo sample with its credit. The fake generator sits
behind a provider interface so a real one could drop in later.

There is no auth, no payments and no database. Your library lives in your own
browser.

## Running it

```bash
bun install
bun dev
```

No environment variables are needed.

| Script | What it does |
| --- | --- |
| `bun dev` | dev server |
| `bun run build` | production build |
| `bun run start` | serve the production build |
| `bun run lint` | eslint |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run samples:fetch` | pull stock candidates from the Pexels API (spec 02) |
| `bun run samples:prepare` | transcode the raw downloads with ffmpeg (spec 02) |
| `bun run samples:check` | verify the sample manifest against what is on disk (spec 02) |

The three `samples:*` scripts are stubs until spec 02.

## How this repo is organised

`spec/` holds the build specs, done in order (00 setup, 01 design system,
02 samples, 03 shell, 04 explore, 05 video, 06 image, 07 library + polish +
deploy). Notes from each one land in `spec/notes/`.

`.agent-logs/` is the prompt/response capture for the assignment. It is
committed on purpose.

> This README gets rewritten properly in spec 07, with the live link and the
> full "what's real, what's simulated, what's next" writeup.

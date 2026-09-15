# 00 - Project setup

## What we're building

A Higgsfield style AI video/image app, as a Next.js app. Name for now is **Video Arena**.

This is for the 8x "Clone Higgsfield" assignment. The brief is 24h and they judge speed, product judgement and UI/UX. So I'm not building the whole thing. What I care about is that it looks and feels really close to a premium AI creative tool and every flow that exists actually works end to end.

### In scope
- Explore page (landing) - a big wall of videos, click one to open it, remix it
- Create video page - model picker, prompt, start frame, end frame, reference images, duration, aspect ratio, resolution, audio toggle
- Create image page - same idea, image controls
- Library - everything you generated in this browser
- Credits page for the stock clips

### Out of scope (dont build these)
- auth / sign in. there is no user account at all. the live link has to work for anyone who opens it
- payments, credits, pricing
- real model calls. no openrouter, no api keys at runtime
- templates, avatars, face swap, the timeline editor
- database, object store, docker

### How "generation" works
Generation is simulated. When you hit generate, the backend picks a pre made clip from our local sample library (spec 02) that matches the aspect ratio and the prompt, fakes a queue + progress, and returns it. The UI must be honest about this, every result gets a "Simulated" badge and the clip credit. Details in spec 05.

I still want the code shaped like it'll talk to a real provider later, so put the fake behind a provider interface.

## Stack
- Next.js, latest stable, App Router, TypeScript (strict)
- bun as the package manager
- Tailwind CSS v4
- shadcn/ui for primitives (dialog, popover, dropdown, tabs, tooltip, switch). restyle them to our theme, they shouldnt look default
- lucide-react for icons
- sonner for toasts
- zustand (with persist) for the library state
- motion (framer motion) only for small transitions, dont go crazy
- deploy on Vercel

Ask me before adding any other big dependency.

## Repo rules (important)
The repo already exists and is a git repo. It has the 8x capture setup in it:
- `.claude/` (settings + capture hook)
- `.agent-logs/`
- `CAPTURE-TEST.md`
- `.gitignore`

Don't delete or edit any of that. `.agent-logs/` has to stay committed.

There's also `design-refs/higgsfield/` with screenshots of their site for UI reference (see its README). It's gitignored on purpose since the repo is public, keep it that way.

`create-next-app` wont run in a folder that isn't empty, so scaffold into a temp folder and move the files in. Merge `.gitignore` instead of overwriting it (keep the note about `.agent-logs/`, the `.claude/hooks/.state/` line and the `design-refs/` line).

## Folder layout
Roughly:

```
src/
  app/
    page.tsx                 # explore
    create/video/page.tsx
    create/image/page.tsx
    library/page.tsx
    credits/page.tsx
    api/generate/video/route.ts
    api/generate/image/route.ts
    api/jobs/[jobId]/route.ts
  components/
    ui/                      # shadcn stuff, restyled
    layout/                  # navbar, footer
    explore/
    create/
    library/
  lib/
    models.ts                # model catalog
    samples.ts               # typed access to the sample manifest
    generation/              # provider interface + mock provider
    store/                   # zustand library store
  data/
    samples.json
public/
  samples/
scripts/
spec/
```

Not strict, just keep it tidy.

## Scripts
In package.json:
- `dev`, `build`, `start`, `lint`
- `typecheck` - `tsc --noEmit`
- `samples:fetch`, `samples:prepare` and `samples:check` (spec 02)

## Order
Do the specs in order, one at a time: 01 design system, 02 samples, 03 shell, 04 explore, 05 video, 06 image, 07 library + polish + deploy.

After each spec:
1. run `bun run typecheck` and `bun run lint` and `bun run build`, fix whatever breaks
2. write what you decided (and anything that surprised you) into `spec/notes/NN-notes.md`. short, just the stuff the next session needs to know
3. commit, including `.agent-logs/`. small commits, not one giant one at the end

If something in a spec is unclear, ask me instead of guessing.

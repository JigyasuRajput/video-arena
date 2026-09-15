# 00 - Project setup, notes

## Versions we landed on

| | |
| --- | --- |
| Next.js | 16.3.5 (App Router, Turbopack, `src/`, `@/*` alias) |
| React | 19.2.8 |
| Tailwind | 4.3.3 (v4, CSS-first, no `tailwind.config`) |
| TypeScript | 5.9.3, `strict: true` |
| bun | 1.4.2 |

Scaffolded into a temp folder and rsynced in, as the spec said, since
`create-next-app` refuses a non-empty directory.

## Decisions worth knowing

**shadcn is on Radix, style preset "nova".** The CLI has changed since most
docs: `-b/--base` now picks the *primitive library* (`base` | `radix` | `aria`),
not a base colour, and it makes you pick a style preset. Took `radix` because it
has the widest documentation surface and the most stable API, which matters
across specs 03-07. Preset barely matters, 01 replaces the token set anyway.
Recorded in `components.json` as `"style": "radix-nova"`.

**`cn` comes from a package now, not a local helper.** `src/lib/utils.ts` is just
`export { cn } from "cn"`. That is shadcn's own package
(github.com/shadcn-ui/cn), a compiled drop-in for `clsx` + `tailwind-merge` —
I checked the provenance because a package literally named `cn` is exactly what
a typosquat looks like. Neither `clsx` nor `tailwind-merge` is installed.

**`typecheck` is `next typegen && tsc --noEmit`, not bare `tsc --noEmit`.**
Next 16 generates globals like `LayoutProps<"/">` into `.next/types`, and
`layout.tsx` uses one. Plain `tsc --noEmit` fails on a clean checkout with
`Cannot find name 'LayoutProps'` until something has generated those types.
Adding `next typegen` makes the script work standalone. Don't "simplify" it back.

**The six primitives are stock shadcn right now** — dialog, popover,
dropdown-menu, tabs, tooltip, switch, plus a `button.tsx` the init dropped in.
They look like default shadcn on purpose; 01 restyles them and rewrites
`globals.css`, which currently still holds the preset's light/dark token set.

**Tooltip needs a provider.** The CLI reminded us to wrap the app in
`TooltipProvider`. Not done yet — it belongs in the root layout in spec 03.

## What I deliberately did not build

Routes beyond `/` are spec 03, so `src/app/` has only the scaffold's
`layout.tsx` and `page.tsx`, both cut down to placeholders. The boilerplate
`page.tsx` had to be replaced regardless: it referenced `/next.svg` and
`/vercel.svg`, which I deleted along with the rest of the scaffold's public
SVGs.

Empty directories from the spec's layout are held open with `.gitkeep`.

`scripts/fetch-pexels.ts`, `prepare-samples.sh` and `check-samples.ts` exist as
stubs that print "see spec 02" and exit 1, so the `samples:*` entries in
`package.json` point at something real instead of erroring with a missing file.

`zod` is **not** installed. Spec 05 needs it for request validation. It isn't in
spec 00's stack list and the spec says to ask before adding dependencies, so it
waits — flag it when starting 05.

## Repo hygiene

`.gitignore` was merged, not overwritten. All three required lines survive: the
note that `.agent-logs/` is deliberately tracked, `.claude/hooks/.state/`, and
`design-refs/`. Added the Next entries plus `samples-raw/` ahead of spec 02.
Kept `.env` + `.env*.local` rather than the scaffold's blanket `.env*`.

`AGENTS.md` and a one-line `CLAUDE.md` (`@AGENTS.md`) come from the scaffold.
`next dev` rewrites the AGENTS.md block on every run, so it is committed to keep
the tree clean — if it shows up dirty in a diff, that is why, just commit it.

`shadcn` itself got installed as a runtime dependency by the CLI; moved it to
`devDependencies`.

## Verified

`bun run typecheck`, `bun run lint` and `bun run build` all pass clean. Dev
server boots in ~200ms and `/` returns 200 with zero env vars set.

Not yet checked: anything visual. There is nothing to look at until 01.

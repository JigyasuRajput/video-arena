# 01 - Design system, notes

## What exists now

Tokens in `globals.css`, Inter + Archivo wired up, and these in
`src/components/ui/`:

`button` `chip` `badge` `card` `popover` `dropdown-menu` `dialog` `segmented`
`switch` `stepper` `tooltip` `skeleton` `upload-slot` `toaster` `tabs`

Plus `src/components/layout/logo.tsx` and `src/app/icon.svg` (favicon).
Everything is on show at `/dev/ui`.

## Three collisions worth remembering

**`.shimmer` is taken. Ours is `.va-shimmer`.** `shadcn/tailwind.css` registers
`@utility shimmer` — a *currentColor text* shimmer. A `@utility` outranks
`@layer components`, so our class silently lost and every skeleton rendered as
an invisible black box while still occupying layout space. Nothing errored; it
only showed up by looking at the page. Don't rename it back.

**`--accent` means two different things.** shadcn uses `--accent` /
`--accent-foreground` for *hover surfaces*; the spec uses `--accent` for the
lime. We kept the spec's meaning, so `bg-accent` is lime. Every shadcn hover
class was rewritten to `bg-surface-3` / `text-text`. If a menu row ever lights
up lime on hover, someone reintroduced `focus:bg-accent`.

**`text-accent-foreground` no longer exists.** We don't define that colour, so
the class is dead. It was stripped from dropdown-menu; don't copy shadcn
snippets in without checking.

## Decisions

- **Dark only via `:root`, not a `.dark` block.** `<html>` still carries the
  `dark` class, but only so shadcn's `dark:` utilities resolve. There is no
  light palette to toggle to.
- **shadcn semantic names are aliased to our palette** in `@theme inline`
  (`--color-popover` → surface-2, `--color-primary` → accent, and so on) so any
  primitive we haven't hand-restyled still lands on brand.
- **Type scale is mapped onto the Tailwind names**, not custom ones:
  `xs/sm/base/lg/xl/2xl/3xl/4xl` = 12/13/14/16/20/28/40/64. `text-base` is
  **14px**, deliberately — this is a dense tool UI.
- **Archivo carries the width axis** (`axes: ["wdth"]`), so `.display` gets
  heavy slightly-condensed uppercase from one font file. `font-stretch: 92%`.
- **`PopoverItem` closes the popover on select** (wraps `Popover.Close`). Radix
  won't do this for a plain button, and leaving the menu open after picking a
  value feels broken. `closeOnSelect={false}` opts out.
- **Focus is one lime outline everywhere**, set globally on `:focus-visible`,
  not per-component ring utilities.
- Button keeps its label mounted but `invisible` while loading so it doesn't
  resize mid-request.
- `UploadSlot` owns no file state — the parent holds `previewUrl` and decides
  what to do with the `File`. It validates type/size and reports via `onError`
  so the caller can toast.

## Verified

- `typecheck`, `lint`, `build` clean.
- `/dev/ui` loaded in Chrome: **zero console errors or warnings** (75 messages,
  all HMR / Fast Refresh / React DevTools noise). No hydration warnings.
- Popover open → select → closes, value updates, chevron resets.
- Dialog opens, traps, closes on Esc and on the close button.
- Toasts fire dark-themed with a lime action button.
- Skeletons shimmer (confirmed via computed style: `shimmer-sweep`, our surface
  gradient, `background-clip: border-box`).
- **375px: no horizontal overflow.** Measured in a same-origin 375px iframe,
  because the Chrome window won't resize below ~495px. Found and fixed a real
  overflow — the 64px type specimen. `scrollWidth` 365 ≤ 375.
- Production build: `/dev/ui` returns **404** and the gallery markup is not in
  the response body. Checked against a real `next start`, not assumed.

## Not done here

- `prefers-reduced-motion` — the CSS block is in the compiled bundle and
  verified present, but not exercised with the OS setting actually flipped.
  Worth a real pass in spec 07's polish.
- Safari not opened yet (spec 07 calls for it; video autoplay is the usual
  breakage and there is no video in the app yet).
- No Lighthouse run — nothing meaningful to measure until Explore exists.
- `PageHeader` / `EmptyState` are spec 03, not built.

## Gotcha for next session

`AGENTS.md` gets rewritten by `next dev` on every run. If it shows as dirty,
that's expected — just commit it.

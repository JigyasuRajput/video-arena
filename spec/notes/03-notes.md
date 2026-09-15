# 03 - App shell, nav, routes, notes

## What exists

Routes: `/`, `/create/video`, `/create/image`, `/library`, `/credits`, plus
`not-found.tsx` and `error.tsx`. All static.

Shell: `Navbar`, `SiteFooter`, `PageHeader`, `EmptyState`, `MediaDialog` +
`useMediaParam`. Config strings live in `src/lib/site.ts`.

## Decisions

**Footer is rendered per-page, not in the layout.** The spec wants it on
Explore, Library and Credits but not the create pages. A route group would work
but splits the tree for one boolean; three explicit `<SiteFooter />` calls are
easier to follow.

**`useMediaParam` closes with `router.back()` only when we pushed the param.**
That makes the close button and the browser back button do the same thing
instead of stacking history. If someone lands directly on a `?media=` URL there
is nothing to go back to, so it strips the param with `replace` instead -
otherwise closing would throw them off the site. Deep-linking is verified
working.

**`useSearchParams` needs a Suspense boundary** or the whole route opts out of
static rendering. Explore wraps its client part and shows skeletons. Worth
remembering for 04/05/06, which all read params.

**Mobile sheet closes on link click, not in an effect.** The obvious
`useEffect(() => setMenuOpen(false), [pathname])` is an eslint error under the
React Compiler rules (`react-hooks/set-state-in-effect`, cascading renders).
Closing in `onClick` is both lint-clean and better behaved - tapping the tab
you're already on still dismisses the sheet.

**Navbar goes compact (h-14 vs h-16) on `/create/*`** so the form gets the room.

**OG image is built from primitives** in `opengraph-image.tsx` - no remote font
or image fetches, so it can't fail at build time. Rendered at build, confirmed
in the route list.

**`site.url` falls back to localhost**, then `VERCEL_PROJECT_PRODUCTION_URL`,
then `NEXT_PUBLIC_SITE_URL`. Still zero env vars required.

## Deliberately temporary

`src/app/explore-placeholder.tsx` - three gradient tiles that open the media
dialog. It exists purely so spec 03's `?media=` criteria are actually
exercisable before samples exist. **Spec 04 deletes this file.**

The `/credits` page is an empty state; spec 02 fills it with the real list.

## Verified

- typecheck, lint, build clean. All 10 routes prerender static.
- Every route returns 200, unknown path returns 404.
- Title template works: `/library` → "Library · Video Arena", `/` → the default.
- Deep link `/?media=placeholder-b` opens the dialog straight from a cold load.
- Browser smoke test: no console errors or warnings.

Not re-checked here (deferred to 07's QA pass): mobile sheet on a real narrow
viewport, focus trap order, arrow-key stepping.

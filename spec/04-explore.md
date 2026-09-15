# 04 - Explore (landing page)

This is the first thing the 8x reviewers see when they open the link, so it has to look great in the first 3 seconds. Look at `design-refs/higgsfield/01-explore-top.jpg` and `02-explore-feed-masonry.jpg`.

## Sections, top to bottom

### 1. Hero
- big uppercase display headline in 2 lines, second line in lime. our own copy, something like "MAKE VIDEOS / FROM A SINGLE PROMPT" (you can suggest better)
- one muted line under it
- a prompt bar right in the hero (same component as the create page, compact version): textarea + chips for model / duration / aspect + Generate. pressing Generate or Cmd/Ctrl+Enter takes you to `/create/video?prompt=...&model=...&duration=...&aspect=...&autostart=1` and the generation starts there
- behind the hero: a slow, dimmed, blurred loop of one of the 16:9 samples. poster first, video fades in once it can play. no autoplay with reduced motion

### 2. Tool tiles
A row of cards like the refs: icon, name, one line, small badge.
- **Video** -> `/create/video` (badge "Popular")
- **Image** -> `/create/image`
- **Remix** -> scrolls to the wall ("Start from any clip")
- **Templates** - disabled, "Soon" badge, tooltip "Put yourself into longer videos. Not in this build." (if this looks weird once built, drop it)

### 3. The wall
- section title "TRENDING" (uppercase lime) + subtitle + "Create" button on the right
- category chips under it: All, Cinematic, People, Nature, Product, Abstract, Motion. selected chip in lime. filter is client side and reflected in the url (`?cat=nature`)
- masonry grid of all samples (videos and images mixed, videos first-ish). CSS columns is fine: 2 cols mobile, 3 tablet, 4-5 desktop, `break-inside: avoid`, ~8px gap
- every card reserves its space from width/height so nothing jumps while loading

### Media card
- poster (or image) shows immediately, rounded, no border until hover
- videos: `muted loop playsInline preload="none"`. start playing when the card is at least half on screen, pause when it leaves (IntersectionObserver). never more than ~6 playing at once, pause the ones furthest from the viewport. on reduced motion don't autoplay, play on hover/tap instead
- hover (desktop): slight lift, gradient at the bottom with the prompt idea (2 lines, clamped), a small **Demo sample** badge, aspect badge, and a **Remix** button
- mobile: the bottom gradient + remix button are always visible but smaller
- click anywhere else on the card -> opens `?media=<id>`
- images get the same treatment minus the video stuff

### Media dialog (for samples)
- left: player with controls (or the image), at its real aspect ratio, fits the viewport
- right panel:
  - **Demo sample** badge + aspect + duration
  - **Prompt idea** with a copy button
  - tags as small chips
  - credit: "Video by {author} on {source}" linked to sourceUrl, and the license link
  - buttons: **Remix** (primary), Copy prompt
- prev / next arrows through the current filtered list, keyboard left/right, Esc to close
- no download button (license + it's a demo)

## Remix
Remix = start a new generation using this sample as the starting point.
- video sample -> `/create/video?remix=<id>`
- image sample -> `/create/image?remix=<id>`

What the create page does with `remix` is in 05/06. The short version: prompt + aspect get prefilled, video remixes also put the poster in as the start frame.

## Performance
- this page should still feel fast on a normal laptop with 24 videos on it. posters via `next/image` with proper sizes, videos only load when near the viewport
- check it with Lighthouse (mobile) once it's done, write the scores in the notes file. aim for 80+ performance, no layout shift from the grid

## Done when
- hero, tiles, wall, filters, dialog, remix links all work
- looks right at 375px, 768px, 1280px, 1600px
- scrolling the wall is smooth and videos play/pause as they come in and out of view

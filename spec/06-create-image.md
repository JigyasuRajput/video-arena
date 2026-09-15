# 06 - Create image

Same idea as video, lighter. Look at `design-refs/higgsfield/05-create-image.jpg`. Reuse as much as possible from 05, don't fork the code: the form, chips, model picker, provider, job route and result card should all take a `kind` and a config instead of being copy pasted.

## Layout
Different from the video page on purpose, closer to the ref:
- empty state: centered hero (a few sample images fanned out like cards, slightly rotated, + an uppercase headline in our words + a muted line)
- the prompt bar is docked at the bottom of the screen, wide, floating on a surface card
- once you've generated something, results fill the area above the bar (newest at the bottom, like a chat, auto scroll to the newest), hero goes away

## Prompt bar
- `+` button on the left to add reference images (up to 4, shown as small thumbs above the textarea with x to remove)
- textarea, placeholder "Describe the image you want"
- chips row under it:
  - **Model** (image models)
  - **Aspect**: 1:1, 4:5, 3:4, 16:9, 9:16 (filtered by model)
  - **Quality**: Standard / High
  - **Resolution**: 1K / 2K
  - **Count** stepper: 1-4
- big lime **Generate** on the right side of the bar (full width on mobile, under the chips)
- Cmd/Ctrl+Enter works here too

Image model catalog in the same `models.ts`, separate list:

```ts
type ImageModel = {
  id: string;
  name: string;
  blurb: string;
  badge?: "Top" | "New";
  aspects: Aspect[];
  qualities: ("standard" | "high")[];
  resolutions: ("1K" | "2K")[];
  maxRefs: number;   // 0-4
  maxCount: number;  // 1-4
};
```

4-5 image models, current well known names, same note as video: capability values are demo config. make at least one differ (no refs, or max 2 images).

## Fake generation
- `POST /api/generate/image` -> same job id scheme, `kind: "image"`, but the job holds a list of sample ids (as many as `count`)
- pick `count` **different** image samples with the same aspect, same scoring + hash logic as video
- if we don't have enough samples in that aspect, fill up with the nearest aspect and render them with `object-cover` inside the requested aspect box so the grid still looks right
- faster: ~3-6s total
- same `/api/jobs/[jobId]` route

## Result group
One card per generation:
- a grid of `count` tiles at the requested aspect. while generating, each tile is a shimmer box, and they "land" one after another with a small stagger (just visual, the job completes once)
- click a tile -> `?media=` dialog for that image
- info row: **Simulated** badge, "Requested: {model}", aspect, quality, resolution, the prompt, credit lines (collapsed into "4 demo samples, see credits" with a popover)
- actions: Regenerate, Reuse, Copy prompt, Delete. per tile: **Use as reference** (adds it to the ref slots) and **Animate** (goes to `/create/video?startFrame=<id>&prompt=...` so that image becomes the start frame and the prompt carries over). Animate is the nice cross link between the two tools, make it work properly

## Remix
`?remix=<imageSampleId>` fills the prompt + aspect and adds the image as the first reference.

## Done when
- generate 1-4 images from a fresh browser, see them land
- model change snaps values like on the video page
- Animate takes an image into the video page as start frame
- the shared code is actually shared (video + image use the same form/chip/result building blocks)

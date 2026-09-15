# 01 - Design system

The whole point of this build is that it looks like a real, premium AI creative tool. Close to Higgsfield in feel. It should not look like a vibecoded shadcn starter.

Before you start, open the screenshots in `design-refs/higgsfield/` and look at them properly. Take the layout, density, spacing and vibe from there. Don't copy their logo, name, headings, copy or any of the media in them. Our brand is Video Arena and all the text is ours.

## Look and feel
- dark only. no light mode, no toggle
- near black background, cards sit on slightly lighter surfaces with a thin low contrast border
- one loud accent: an electric lime. used for primary buttons, active nav tab, section titles, small highlights. not everywhere
- big bold uppercase headings for sections, normal sentence case for everything else
- media first. videos and images do most of the talking, UI chrome stays quiet
- rounded everything. cards ~16px, inputs ~12px, chips and pills fully round
- controls are chips/pills with an icon + value (like `[clock] 8s`, `[ratio] 16:9`) instead of plain selects

## Tokens
Put these in `globals.css` as CSS variables and wire them into the Tailwind v4 `@theme`. Tweak the exact values if something looks off, but keep the structure.

```
--bg:            #0a0a0b
--surface:       #121214
--surface-2:     #1a1a1e
--surface-3:     #232328   (hover / pressed)
--border:        rgba(255,255,255,0.08)
--border-strong: rgba(255,255,255,0.16)
--text:          #f4f4f5
--text-muted:    #a1a1aa
--text-faint:    #71717a
--accent:        #d7ff3a
--accent-hover:  #c8f02a
--accent-fg:     #0a0a0b   (text on accent)
--pink:          #ff3d8b   (only for tiny "Top" / "New" badges)
--danger:        #ff5a5f
--success:       #3ddc97
```

Primary button has a subtle inner highlight + a darker bottom edge so it feels a bit raised, not flat.

## Type
- UI font: Inter via `next/font`
- display font for the big uppercase headings: a heavy, slightly condensed grotesk. try Archivo (with the width axis) or Anton, pick whichever looks closer to the refs
- scale: 12 / 13 / 14 / 16 / 20 / 28 / 40 / 64. display headings use tight line height and a little negative tracking
- numbers in chips and timers use tabular nums

## Components to build (in `components/ui`)
- `Button` - variants: primary (lime), secondary (surface-2), ghost, outline. sizes sm/md/lg. loading state with spinner
- `Chip` - icon + label, used as a trigger for popovers (duration, aspect, resolution etc). has an active state
- `Badge` - small, for "Simulated", "Demo sample", "Top", "New", aspect ratio labels
- `Card` - surface + border + radius
- `Popover` / `DropdownMenu` - dark, blurred background, for the chip menus and the model picker
- `Dialog` - for the media detail view
- `Segmented` - for small option sets (like 1 / 2 / 3 / 4 images)
- `Switch` - for audio on/off
- `Stepper` - the `- 1/4 +` count control
- `Tooltip`
- `Skeleton` - shimmer, used a lot
- `UploadSlot` - dashed box with an icon + label ("Start frame"), shows a thumbnail with a remove button once filled
- toasts via sonner, themed dark

Restyle the shadcn pieces to these tokens. No default shadcn look anywhere.

## Motion
- 150-200ms, ease-out. hover on media cards: slight lift/scale (1.02) + border brightens
- skeleton shimmer on anything loading
- generation progress gets its own nicer animation (spec 05)
- respect `prefers-reduced-motion`: no autoplay videos, no scale effects

## Logo
Make a simple original mark: a small geometric glyph in an svg + "video arena" wordmark in lowercase. Nothing that looks like their logo. Also use the glyph as the favicon.

## Layout basics
- max content width ~1400px with 16px side padding on mobile, 24px on desktop
- must look right at 375px wide. no horizontal scroll anywhere

## Done when
- a `/dev/ui` page (dev only, don't link it anywhere, 404 in production) shows every component in its states so I can eyeball them in one place
- nothing on it looks like default shadcn

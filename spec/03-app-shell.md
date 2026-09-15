# 03 - App shell, nav, routes

## Routes
- `/` - Explore (spec 04)
- `/create/video` - Video (spec 05)
- `/create/image` - Image (spec 06)
- `/library` - Library (spec 07)
- `/credits` - sample credits (spec 02)
- `not-found` + a global error boundary, both on brand

The media detail view is a dialog driven by a search param (`?media=<id>`) so it can be linked and the back button closes it. Works on any page that shows media.

No auth anywhere. No login button, no profile menu, nothing gated.

## Navbar
Sticky at the top, `--bg` with a slight blur when scrolled + a bottom border that only shows after scrolling.

Left:
- logo (links to `/`)
- tabs: **Explore**, **Video**, **Image**, **Library**. active tab is lime, others muted, hover goes white

Right:
- a small **Demo build** pill. clicking it opens a popover that says, in plain words: generation here is simulated, results come from a library of free stock clips, nothing is sent to any model, and your library only lives in this browser. link to `/credits`
- **Create** primary button -> `/create/video`

Mobile (< 768px):
- logo + Create button + a menu button
- menu opens a sheet from the top with the four tabs and the demo note
- on the create pages, keep the nav compact so the form gets the space

## Footer
Small and quiet, only on Explore, Library and Credits (not on the create pages):
- "Video Arena, a Higgsfield style demo built for an 8x assignment"
- links: Credits, GitHub repo
- one line: "Demo samples from Pexels and Mixkit, see credits"

## Metadata
- title template `%s · Video Arena`, per page titles
- description, theme color = `--bg`
- an OG image (static is fine, made with `next/og` or a png) so the live link looks good when pasted in Slack/WhatsApp
- favicon from the logo glyph

## Shared pieces
- `MediaDialog` - the `?media=` dialog. big player/image on the left, info panel on the right (on mobile: stacked). used by explore + library + create results. details of what goes in the panel are in 04 and 07
- `PageHeader` - uppercase display title + muted subtitle + optional right side action
- `EmptyState` - icon, title, one line, one button

## Done when
- all routes exist (pages can be placeholders for now), nav works on desktop and mobile, active states are right
- 404 and error pages look on brand
- `?media=` opens and closes the dialog, back button closes it, Esc closes it

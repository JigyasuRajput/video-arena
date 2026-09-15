# 02 - Sample library, notes

## Done

41 samples collected, processed and committed: **24 videos** (10× 9:16,
10× 16:9, 4× 1:1) and **17 images** (5× 1:1, 3× 4:5, 3× 3:4, 3× 16:9, 3× 9:16).
**33.1 MB** total, well under the 80 MB cap. `samples:check` passes clean.

Pexels only — Mixkit dropped to save time, per instruction. The `source` field
still allows `"Mixkit"` so nothing needs changing if it comes back.

```bash
bun run samples:fetch --dry-run   # rehearse, downloads nothing
bun run samples:fetch             # + writes src/data/samples.json
bun run samples:prepare           # ffmpeg crop/scale/transcode
bun run samples:check             # validate manifest against disk
```

## Two things the scripts got wrong on first run

**ffmpeg here is built without libwebp.** Homebrew's build has no webp encoder,
so `-c:v libwebp` died on the first image. Images now go ffmpeg → intermediate
PNG → `cwebp`. The script checks for `cwebp` up front and says what to install.

**One fixed CRF isn't enough.** `waterfall-forest-drop` came out at 8.2 MB
against a 6 MB cap — busy water/snow/particle footage compresses far worse than
static scenes. Videos now step CRF 28 → 32 → 36 → 40 until they fit (that clip
landed at 4.0 MB). The webp path already did this with quality.

**And a real bug in `--only`:** it rebuilt the manifest from just the re-fetched
slots, which would have silently dropped the other 37 entries. It now merges
over the existing manifest. Found before it did any damage, but only because I
checked the entry count after re-running.

## Content review — 4 replaced

I built contact sheets from the posters and images and looked at all 41. Four
broke the rules and were re-queried:

| id | problem |
| --- | --- |
| `img-perfume-square` | **CHANEL, JIMMY CHOO and ESTÉE LAUDER** all fully legible |
| `img-neon-alley` | not an alley at all — a retail rack of embroidered patches, covered in logos |
| `skate-street-run` | storefront business signage, subjects who may be minors, and 2/3 empty pavement |
| `ocean-waves-vertical` | a named vessel with legible hull lettering, and nothing like its prompt |

Replacements are clean: a skater silhouette on a ramp at dusk, turquoise surf,
unbranded dark bottles, and a wet night street.

`img-perfume-square` is now bottles rather than perfume, so its prompt idea and
tags were rewritten to describe what's actually there. **The id still says
"perfume"** — it's the filename and appears in `?media=` URLs. Cosmetic, left
alone deliberately; rename it if it bothers you.

**Judgement calls I made, worth a second opinion on `/credits`:**

- `img-neon-alley` has a lit postal kiosk with Arabic signage. Institutional
  signage, not a commercial logo. Being absolutist here would make the whole
  "neon city" theme impossible — neon *is* signage.
- `city-traffic-timelapse` has a generic "HOTEL" sign and a small van with a
  generic word on it. No recognisable logo, illegible at card size.

**Weaker than it sounds:** the automated blocked-word filter only runs against
Pexels alt text, and the *video* endpoint returns none. So for all 24 clips the
filter did nothing — the contact-sheet review was the only real check. Worth
knowing if more get added later.

## Decisions

**Everything is centre-cropped to an exact aspect.** Stock comes in arbitrary
ratios, but the manifest promises exact dimensions and `check-samples` verifies
the real file against them with ffprobe. Cropping makes that literally true and
keeps the masonry wall predictable. Target sizes live in `ASPECT_DIMENSIONS` in
`src/lib/samples.ts`, shared by all three scripts.

**The manifest is generated, not hand-written** — `fetch-pexels.ts` merges the
curation table (prompt, tags, category, aspect) with the API's credit data.
41 entries of hand-maintained credit metadata would drift.

**Downloads take the smallest file that still covers the crop**, so we aren't
pulling 4K to make a 720p clip. Raw downloads were 209 MB; output is 33 MB.

## Still unverified

Some clips are weak content matches rather than rule violations — `neon-street-rain`
and `night-walk-city` are both very dark and hard to read as their theme, and
`ink-water-vertical` is washed out. Not replaced; flag on `/credits` if you want
them swapped.

Only the poster frame of each video was reviewed, not the full 10 seconds.
Something could appear mid-clip that isn't in frame at the 1s mark.

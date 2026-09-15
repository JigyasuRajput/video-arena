# 02 - Sample library, notes

## ⚠️ Blocked on the API key - no media collected yet

`PEXELS_API_KEY` was supposed to be in `.env.local`. There is no `.env.local` in
the repo and the variable isn't exported in the shell either, so **nothing has
been downloaded**. `src/data/samples.json` is `[]` and `public/samples/` is
empty.

Everything around the media is built and committed. To finish:

```bash
echo 'PEXELS_API_KEY=your_key_here' > .env.local
bun run samples:fetch --dry-run   # confirm all 41 slots resolve, downloads nothing
bun run samples:fetch             # downloads + writes src/data/samples.json
bun run samples:prepare           # ffmpeg crop/scale/transcode
bun run samples:check             # validate manifest against disk
```

Until then `/credits` shows an empty state and Explore has no wall. **Spec 04
cannot be finished without this.**

## Scope change

Pexels only — Mixkit dropped to save time, per instruction. `source` in the
type still allows `"Mixkit"` so nothing needs changing if it comes back.

## Curation

I picked the slots rather than waiting for review. The table lives at the top of
`scripts/fetch-pexels.ts`: 41 slots, each with its query, target aspect,
category, and a prompt idea + tags I wrote.

Audited against the spec's target mix — it matches exactly:

| | |
| --- | --- |
| videos | 10× 9:16, 10× 16:9, 4× 1:1 (24) |
| images | 5× 1:1, 3× 4:5, 3× 3:4, 3× 16:9, 3× 9:16 (17) |
| categories | nature 13, cinematic 9, abstract 7, product 6, people 4, motion 2 |

No duplicate ids.

**On the "no brands / kids / famous people" rule:** the script filters Pexels
alt text against a blocked-word list, but that is coarse and only covers photos
(the video endpoint returns no alt text). It is *not* a guarantee. The picks
need eyes on them once they download — I'd planned to generate contact sheets
from the posters and check them before committing any media. Your `/credits`
review is the second pass, not the first.

## Decisions

**Everything is centre-cropped to an exact aspect.** Stock media comes in
arbitrary ratios, but the manifest promises exact dimensions and `check-samples`
verifies the real file against them. Cropping makes that true instead of
approximate, and keeps the masonry wall predictable. Exact target sizes live in
`ASPECT_DIMENSIONS` in `src/lib/samples.ts`, shared by all three scripts.

**The manifest is generated, not hand-written.** `fetch-pexels.ts` emits
`src/data/samples.json` by merging my curation table (prompt, tags, category,
aspect) with the API's credit + id data. Hand-maintaining 41 entries of credit
metadata would drift.

**Downloads pick the smallest file that still covers the crop**, so we're not
pulling 4K to make a 720p clip.

**WebP quality steps down** (82 → 50) until the image is under 400 KB, rather
than guessing one quality and hoping.

**`--dry-run` and `--only=<id>,<id>`** exist so a failed slot can be re-queried
without re-downloading the other 40, and so the whole run can be rehearsed
against the rate limit (200/hour) before committing to it.

## Verified

- typecheck, lint, build clean. `/credits` renders its empty state, no console
  errors.
- All three scripts fail with a clear, actionable message: fetch explains the
  missing key, prepare and check both say the manifest is empty.
- Curation table audited programmatically against the spec's target mix.

## NOT verified — the honest list

None of the runtime paths have executed, because they all need the key:

- No Pexels API call has ever been made. The response parsing, the
  `coversAspect` crop maths, the video-file selection and the download loop are
  **written but untested**. Expect at least one thing to need a fix on first run.
- `prepare-samples.sh` has never processed a file. The ffmpeg crop expression,
  the poster seek and the webp quality loop are unexercised.
- `check-samples.ts` has never run against a populated manifest.

ffmpeg 8.1 and ffprobe are both present locally, so nothing else blocks it.

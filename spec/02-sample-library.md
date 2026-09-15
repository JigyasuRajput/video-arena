# 02 - Sample library (the "pre generated" media)

We're not calling any real model, so everything the app shows comes from a small local library of free stock clips and images. Explore uses it, and the fake generator (spec 05/06) picks results out of it.

## Rules
- sources: **Pexels** and **Mixkit** only. before adding anything, check the license on that item's page and only use it if it allows this kind of use. keep the credit + link for every item
- these are NOT model outputs. never attach a model name to a sample anywhere (not in the manifest, not in the UI)
- in the UI every sample is labelled **Demo sample** and shows its credit ("Video by X on Pexels", linked)
- don't take anything from Higgsfield or any other AI site
- keep it light: each clip under ~6 MB, max 720p on the short side, max ~10s. whole `public/samples` folder under ~80 MB

## What to collect
~24 video clips and ~17 images. Mix of aspect ratios, roughly:
- videos: 10x 9:16, 10x 16:9, 4x 1:1
- images: 5x 1:1, 3x 4:5, 3x 3:4, 3x 16:9, 3x 9:16

Themes (the explore wall should feel cinematic and varied):
neon city at night, rain on glass, drone over mountains / coast, ocean waves slow mo, forest fog, desert, snow, portrait with wind in hair, dancer / movement, skateboarding, street fashion, car at night, product shots (sneaker, perfume, watch, drink), food close up, ink or smoke abstract, fireworks / lights, space-ish / stars.

Stay away from anything with visible brands, logos, kids, or recognisable famous people.

## How to get them
- Pexels: write `scripts/fetch-pexels.ts` that uses the Pexels API with `PEXELS_API_KEY` from `.env.local` (I'll add the key). It searches each theme, lets me review the candidates (just print a list with preview links + author + page url + license link, and write it to `samples-raw/candidates.json`), and downloads only the ones I mark. The key is only for this script, the app never uses it
- Mixkit: no API, I'll download those by hand into `samples-raw/`
- `samples-raw/` is gitignored

## Processing
`scripts/prepare-samples.sh` (needs ffmpeg locally):
- videos: transcode to H.264 mp4, short side 720, crf ~28, `-an` (strip audio, we don't need it), `+faststart`, trim to 10s max
- posters: grab a frame at ~1s as a jpg, ~720px on the short side, quality ~4
- images: convert to webp (or jpg), max 1440px on the long side, under ~400 KB
- print the final size of every file and fail loudly if anything is over the limit

Output:
```
public/samples/videos/<id>.mp4
public/samples/posters/<id>.jpg
public/samples/images/<id>.webp
```

## Manifest
`src/data/samples.json`, typed through `src/lib/samples.ts`.

```ts
type Aspect = "16:9" | "9:16" | "1:1" | "4:5" | "3:4";

type Sample = {
  id: string;                 // "neon-street-rain", also the filename
  kind: "video" | "image";
  src: string;                // "/samples/videos/neon-street-rain.mp4"
  poster?: string;            // videos only
  width: number;
  height: number;
  aspect: Aspect;
  durationSec?: number;       // videos only
  prompt: string;             // a prompt WE wrote that describes the clip
  tags: string[];             // lowercase keywords, used for matching prompts
  category: "cinematic" | "people" | "nature" | "product" | "abstract" | "motion";
  credit: {
    author: string;
    source: "Pexels" | "Mixkit";
    sourceUrl: string;        // the item's page, not the file url
    license: string;          // "Pexels License" etc
    licenseUrl: string;
  };
};
```

About `prompt`: the clip wasn't made from it, it's just a good prompt that describes what's in it (so remix has something to start from). In the UI call it **Prompt idea**, not "Prompt".

Write prompts like real video gen prompts: subject, action, setting, camera, light, mood. 1-3 sentences.

`lib/samples.ts` exports helpers: `getSamples(kind?)`, `getSample(id)`, `samplesByAspect(kind, aspect)`, `nearestAspect(aspect, available)`.

## Check script
`scripts/check-samples.ts` (`bun run samples:check`):
- every manifest entry has its files on disk (src + poster)
- no orphan files in `public/samples`
- sizes under limits, total under ~80 MB
- width/height/aspect/duration in the manifest match the real file (use ffprobe if it's there, otherwise skip that check with a warning)
- no duplicate ids, every item has a credit + license url
- there's at least 2 videos for every aspect the video form offers, and at least 2 images for every aspect the image form offers (so the fake generator always has something to return)

Run it in CI later maybe, for now just before committing.

## Credits page
`/credits` lists every sample: small thumb, author, source link, license link. Footer links to it.

## Done when
- files are in `public/samples`, manifest is filled in, `samples:check` passes
- `samples-raw/` is gitignored and not committed

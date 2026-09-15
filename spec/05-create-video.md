# 05 - Create video (simulated generation)

The main tool page. Look at `design-refs/higgsfield/03-create-video-hero.jpg` and `04-create-video-panel-and-results.jpg`.

## Layout
Desktop:
- **left panel** (~340px, sticky, scrolls on its own if it's taller than the screen), top to bottom:
  1. Start frame / End frame upload slots side by side, with a small swap button between them
  2. Reference images row (up to 3 small slots)
  3. Prompt box
  4. Model row (opens the model picker)
  5. Chips row: duration, resolution, aspect ratio, audio
  6. **Generate** button, full width, lime
- **right side**: the results feed for this page (newest on top)

Empty state (nothing generated yet in this browser): the right side shows a hero like the ref, big uppercase headline + a few sample clips from the library in a soft grid, "try one of these" style. clicking one fills the prompt with its prompt idea.

Mobile: panel first, generate button sticks to the bottom of the screen, results below.

## Controls

### Model picker
Popover with a list of model cards: name, one line description, small badges (Top / New / Audio), supported durations shown as tiny chips. Search box at the top.

Catalog lives in `src/lib/models.ts`:

```ts
type VideoModel = {
  id: string;
  name: string;
  blurb: string;
  badge?: "Top" | "New";
  durations: number[];          // seconds
  aspects: Aspect[];
  resolutions: ("480p" | "720p" | "1080p")[];
  audio: boolean;
  startFrame: boolean;
  endFrame: boolean;
  maxRefs: number;              // 0-3
};
```

Put 5-6 models in there, use the names of video models people actually know right now (veo, kling, seedance, wan, hailuo, whatever is current on openrouter's video model list). The capability numbers are our demo config and don't need to be exact, we're not calling them. But make them differ so the UI logic gets exercised: e.g. one model only does 8s, one has no audio, one has no end frame support, one only does 16:9 + 9:16. Add a comment at the top of the file saying this.

### Frames + references
- `UploadSlot`: click or drag and drop, png/jpg/webp, max 10 MB, shows the thumb with an x to remove
- files never leave the browser. keep them as object urls for preview. for the library we only keep a small downscaled thumbnail (~256px, made with a canvas) not the full image
- if the selected model doesn't support end frame (or refs), that slot is disabled with a tooltip saying why
- swap button swaps start and end

### Prompt
- textarea, auto grows, placeholder "Describe the shot. Subject, action, camera, light..."
- max 1500 chars with a counter that shows up near the limit
- a small "Enhance" ghost button is NOT needed, don't add it

### Chips
- **Duration**: only the durations the model supports. options overall: 4, 5, 6, 8, 10
- **Resolution**: 480p / 720p / 1080p, filtered by model
- **Aspect**: 16:9 / 9:16 / 1:1, filtered by model, each option shows a little shape icon
- **Audio**: on/off switch. disabled + off if the model has no audio

When the model changes and the current duration/aspect/resolution isn't supported, snap to the nearest supported value and show a toast like "Veo only does 8s, switched duration to 8s".

### Generate button
- disabled until the prompt has at least 3 non space chars
- shows a spinner for the request itself only, then goes back to normal so you can queue more
- Cmd/Ctrl+Enter from the prompt triggers it
- max 4 generations in flight at once, the 5th shows a toast

No credits, no prices anywhere.

## URL params
- `?prompt=&model=&duration=&aspect=` prefill (from the explore hero) and if `autostart=1` is there, kick off the generation once
- `?startFrame=<imageSampleId>&prompt=` puts that sample image in as the start frame (used by Animate on the image page, spec 06)
- `?remix=<sampleId>` prefill prompt + aspect from the sample, put its poster in as the start frame (shown with a small "from remix" tag you can remove), pick the nearest allowed duration
- clean the params out of the url after reading them so a refresh doesn't start another generation

## How the fake generation works

### Provider interface
`src/lib/generation/types.ts`

```ts
interface GenerationProvider {
  submit(req: GenerationRequest): Promise<{ jobId: string; etaMs: number }>;
  status(jobId: string): Promise<JobStatus>;
}
```

`src/lib/generation/mock.ts` implements it. Pick the provider from `GENERATION_MODE` (default and only value for now: `mock`). No real provider in this build, just leave a comment where it'd go.

### API
- `POST /api/generate/video` - body validated with zod: `{ model, prompt, duration, aspect, resolution, audio, hasStartFrame, hasEndFrame, refCount, seed? }`. validates against the model catalog too (400 with a clear message if the combo is invalid). returns `{ jobId, etaMs }`
- `GET /api/jobs/[jobId]` - returns `{ status: "queued" | "generating" | "completed" | "failed", progress, result?, error? }`

Vercel functions don't share memory, so **don't keep jobs in memory**. Make the job id self contained: base64url of `{ kind, sampleId, createdAt, etaMs }` plus a short HMAC so it can't be edited by hand (secret from `JOB_SECRET` env, with a hardcoded dev fallback so the app still runs with zero env vars). `status()` just decodes it and works out the state from the time that has passed. This also means refreshing the page mid generation still works.

### Picking a sample
1. candidates = video samples with the same aspect (if none, nearest aspect)
2. score each by overlap between prompt words and the sample's tags + prompt idea (lowercase, drop stop words)
3. take the top ~3 and pick one using a hash of `prompt + seed`. so the same prompt gives the same clip, and **Regenerate** (new seed) can give a different one
4. if there's no overlap at all, just pick by the hash from all candidates

Don't worry about the clip length matching the requested duration, results just loop.

### Timing
- queued for ~1.5s, then generating
- eta ~ 6s + 0.6s per second of duration + 3s if 1080p, with a bit of jitter from the hash. cap at ~15s
- progress isn't linear, ease it so it moves fast at first and slows near the end, then jumps to 100 on complete

### Failures
- never fail randomly
- for testing the error UI: if `NODE_ENV !== "production"` and the prompt contains `[fail]`, the job fails at ~50% with a realistic message

## Result cards (right side)
Like ref 04: media on the left, info column on the right. On mobile, stacked.

States:
- **queued / generating**: a box at the requested aspect ratio with an animated gradient/noise shimmer (if there's a start frame, use it blurred as the background), progress %, "Generating" + elapsed seconds, and a Cancel button (cancel just stops polling and marks it canceled)
- **completed**: the clip plays muted + looped, click opens `?media=` dialog
- **failed / canceled**: muted box with the message and a Retry button

Info column:
- badges: **Simulated** (with a tooltip "Generation is simulated in this demo, the clip is a stock sample"), requested model name as "Requested: {model}", duration, aspect, resolution, audio on/off
- the prompt (the user's, not the sample's), clamped with expand
- thumbs of the start/end/ref frames if any
- small credit line for the sample that was returned
- actions: **Regenerate** (same settings, new seed), **Reuse** (loads these settings back into the panel), Copy prompt, Delete

Polling: every 1.5s per active job, stop when done. use one interval for all active jobs, not one per card.

Every generation (with its settings, thumbs, jobId, status, result sample id) is saved into the library store (spec 07) the moment it's submitted and updated as it changes.

## Done when
- you can generate from a fresh browser, see progress, get a clip that roughly matches the prompt and aspect
- model switching snaps values correctly, disabled slots explain themselves
- remix from explore lands here prefilled
- refresh during generation, it picks back up and finishes
- `[fail]` shows the error state in dev
- zero env vars needed to run it

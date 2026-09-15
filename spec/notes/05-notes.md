# 05 - Create video, notes

## What exists

`/create/video`: sticky left panel (frames, references, prompt, model, chips,
Generate), results feed on the right, empty-state hero before anything has been
generated. Simulated generation end to end, through an API, with polling and a
library store behind it.

New: `src/lib/generation/*`, `src/lib/store/*`, `src/lib/create/settings.ts`,
`src/components/create/*`, three route handlers.

`zod` was added here. Spec 00 deliberately left it out and flagged it for this
spec; it's the only new dependency.

## Shared with spec 06 by design

Spec 06 says not to fork the code, so 05 was built as shared parts from the
start rather than refactored afterwards:

- **One provider, one job-id scheme, one sample picker.** `pickSampleIds` takes
  a `count`; video asks for 1, image asks for `count`. Same scoring, same hash.
- **One job route.** `/api/jobs/[jobId]` never branches on kind - the id carries
  its own.
- **Two 15-line submit routes** over a shared `handleSubmit(kind, body)`.
- **One queue and one poller** (`useGenerationQueue`, `useJobPoller`) covering
  every active job of either kind, from a single interval.
- **Form primitives** (`ChipSelect`, `ModelPicker`, `PromptBox`, `AspectIcon`,
  `GeneratingBox`, `ResultMeta`, `Hint`) and one `snapField` helper that writes
  the "switched duration to 8s" sentences.

Only the layouts fork, because spec 06 asks for a different shell.

## Decisions

**Job ids are the entire job.** `base64url(JSON) + "." + HMAC`, holding kind,
the chosen sample ids, createdAt and the eta. `status()` decodes it and derives
the state from elapsed time. No store, no memory, so it survives a cold
function instance *and* a page refresh with the same mechanism - which is why
"refresh mid-generation" needed no extra code. `JOB_SECRET` falls back to a
hardcoded dev value so the app still runs with zero env vars.

**Progress is eased, not linear** (`1-(1-t)^1.9`), capped at 97 until complete.
A 15s linear bar reads as frozen.

**`[fail]` gives up at ~50% of the *bar*, not 50% of the time.** Because the
curve is front-loaded, the time midpoint shows 73%, which reads as "it nearly
worked". Found by testing it; `FAIL_AT_T = 0.294` is the inverse.

**No seed on a first generation, a new one on Regenerate.** The spec wants the
same prompt to give the same clip. If every submit seeded randomly that would
be false. Regenerate is the only thing that moves the seed, and it rotates the
shortlist to a different sample.

**Prefill is read as initial state, not in an effect.** `useState(() =>
readVideoPrefill(params))`. Reading it in an effect would paint the defaults
first and would trip `react-hooks/set-state-in-effect`, which this repo has as
an error. Params are then stripped with `history.replaceState`, not
`router.replace` - Next would re-run the route and reset scroll for nothing.

**The store row is written before the POST goes out.** The feed reacts
instantly and a 400 has a card to show its error in. `jobId` is `""` for that
moment and the poller skips those.

**Autostart waits for hydration.** `rehydrate()` replaces `items` wholesale, so
a row added before it lands would be wiped. Only the results column is gated on
`ready`; the panel renders immediately.

**Two layers of validation.** zod for shape, then the catalogue for the
combination. A body can be perfectly well-formed and still ask Veo for 5s, and
the client isn't the place that decides that's fine. Verified: a Veo/5s POST
returns `400 "Veo 3 does not support 5s. Supported: 8s."`

**Empty-state tiles are a uniform 4:5**, not each sample's own ratio. First
pass used the real ratios and the grid came out ragged with half-empty cells.

## Verified in the browser

- Generate from a fresh browser: queued → generating → clip plays. The scorer
  returned an aerial-over-ridges clip for "drone flying over snowy mountain
  ridges at golden hour", which is the point of the scoring.
- Cmd+Enter from the prompt submits.
- Switching to Veo 3 toasted **"Veo 3 only does 8s, switched duration to 8s"**,
  snapped the chip, disabled the end-frame slot and the swap button, and
  enabled the audio switch.
- **Refreshed mid-generation**: came back at 34% / 6s elapsed and finished
  normally, with the earlier result restored from localStorage.
- `?remix=ocean-waves-vertical`: prompt idea, 9:16, nearest duration (10s),
  poster in as the start frame with a removable "from remix" tag, and the URL
  cleaned back to `/create/video`.
- `[fail]` in dev fails at 50% with a realistic message (curl).
- A hand-edited job id returns "Unknown or tampered job id."
- Console clean on a fresh load: no errors, no warnings, no hydration mismatch.
- typecheck, lint, build clean. The three API routes are the only dynamic ones.

## Not done here

- **The `?media=` dialog on this page reuses `SampleMediaDialog`**, so it shows
  the sample's credit and "Prompt idea" rather than the generation's own
  settings. Spec 07 explicitly builds the generation panel for that dialog -
  this is the placeholder until then, and it does show the right media.
- `/library` is still the spec-03 empty state. The store it reads is built and
  populated; only the page is outstanding.
- Responsive checked at desktop width only so far.

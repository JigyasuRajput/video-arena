# 07 - Library, polish, deploy

Last one. After this it should be something I'm happy to put in front of reviewers.

## Library store
`src/lib/store/library.ts`, zustand + persist to localStorage (key `va-library-v1`).

```ts
type Generation = {
  id: string;
  kind: "video" | "image";
  createdAt: number;
  status: "queued" | "generating" | "completed" | "failed" | "canceled";
  jobId: string;
  request: GenerationRequest;       // everything from the form
  thumbs: { start?: string; end?: string; refs: string[] }; // small data urls only
  resultSampleIds: string[];        // empty until completed
  error?: string;
};
```

- cap at 100 items, drop the oldest
- wrap every read/write in try/catch. if storage is full, first drop thumbs from old items, then old items. if storage isn't available at all (private mode etc) the app still works for the session, just show a one time toast
- hydrate on the client only, avoid hydration mismatch warnings (render a skeleton until the store is ready)
- on app load, any item still `queued`/`generating` goes back into the poller (the job id is self contained so this just works)

## /library page
- page header "LIBRARY" + count
- tabs: All / Videos / Images
- search box (matches the prompt), sort newest/oldest
- grid of cards: media (or shimmer / error state), status badge, kind icon, model, relative time. hover shows the prompt
- click -> `?media=` dialog. for generations the panel shows: Simulated badge, requested model + all settings, the user's prompt, frame thumbs, the sample credit, and actions: Regenerate (put the request into the store as a draft, go to the right create page, it picks the draft up and starts it), Reuse settings, Copy prompt, Delete
- select mode with multi delete, and a "Clear library" with a confirm dialog
- empty state: "Nothing here yet" + buttons to Video and Image
- small note at the top: "Saved in this browser only"

## Polish pass
Go through the whole app with this list:
- loading: skeletons everywhere something loads, no blank flashes
- every button has a hover, active, focus-visible and disabled state
- keyboard: tab order makes sense, dialogs trap focus, Esc closes things, arrow keys in the media dialog
- aria labels on icon only buttons, alt text on images (use the prompt)
- reduced motion respected
- toasts for copy, delete, errors. nothing uses `alert()`
- no console errors or warnings in the browser
- check all pages at 375 / 768 / 1280 / 1600
- check Chrome and Safari (video autoplay is the usual thing that breaks on Safari, test it)
- run Lighthouse on `/` and `/create/video`, put the numbers in the notes

## README
Rewrite it:
- what this is (Higgsfield style video/image creation UI, built for the 8x assignment) + live link
- what's real and what's simulated, and why (time box, cost, and I wanted to spend the time on UX)
- what I left out on purpose: auth, payments/credits, real model calls, templates/avatars/face swap
- what I'd build next, in order: real generation through openrouter behind the same provider interface, auth + server side library, credits, then templates + avatars (the "put yourself in the video" idea)
- how to run locally (bun install, bun dev, no env needed), the sample scripts, how the spec folder works
- sample credits -> link to `/credits`
- mention `.agent-logs/` and what it is

## Deploy
- Vercel, production branch = main
- no env vars required. `JOB_SECRET` optional (set it in prod anyway)
- `PEXELS_API_KEY` is only for the local fetch script, don't add it to Vercel
- after deploy, open the live link in an incognito window and go through: explore -> open a clip -> remix -> generate -> library -> image -> animate. everything has to work signed out on a fresh browser
- check the OG preview by pasting the link somewhere

## Done when
- library works and survives refresh, including mid generation
- polish list is done
- live link works in incognito, README is updated, everything committed including `.agent-logs/`

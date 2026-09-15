/**
 * Collect the demo sample library from Pexels.
 *
 *   bun run samples:fetch            # search, pick, download, write manifest
 *   bun run samples:fetch --dry-run  # search and report, download nothing
 *   bun run samples:fetch --only=neon-street-rain,forest-fog
 *
 * Needs PEXELS_API_KEY in .env.local (Bun loads that automatically). The key is
 * used here and nowhere else - the app itself never talks to Pexels.
 *
 * Mixkit is intentionally not covered: this build sources from Pexels only.
 *
 * Everything under samples-raw/ is gitignored. Only the processed output in
 * public/samples/ ships.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  ASPECT_DIMENSIONS,
  type Aspect,
  type Sample,
  type SampleCategory,
} from "../src/lib/samples";

const RAW_DIR = "samples-raw";
const MANIFEST_PATH = "src/data/samples.json";

const PEXELS_LICENSE = {
  license: "Pexels License",
  licenseUrl: "https://www.pexels.com/license/",
} as const;

/**
 * Words that suggest content the spec rules out - children, identifiable
 * celebrities, visible branding. Matched against the Pexels alt text. It is a
 * coarse filter, not a guarantee, so the picks still get eyeballed afterwards.
 */
const BLOCKED_WORDS = [
  "child", "children", "kid", "kids", "baby", "babies", "toddler", "infant",
  "boy", "girl", "teen", "school", "family", "logo", "brand", "branded",
  "nike", "adidas", "apple", "coca", "pepsi", "starbucks", "celebrity",
  "president", "politician",
];

type Slot = {
  id: string;
  kind: "video" | "image";
  aspect: Aspect;
  category: SampleCategory;
  /** Pexels search query. */
  query: string;
  /** Hint for framing; we crop to the exact aspect regardless. */
  orientation?: "landscape" | "portrait" | "square";
  /** A prompt we wrote describing the shot. Never a real generation prompt. */
  prompt: string;
  tags: string[];
};

// ---------------------------------------------------------------------------
// Curation. 24 videos (10x 9:16, 10x 16:9, 4x 1:1) and 17 images
// (5x 1:1, 3x 4:5, 3x 3:4, 3x 16:9, 3x 9:16).
// ---------------------------------------------------------------------------
const SLOTS: Slot[] = [
  // --- videos, 9:16 ---
  {
    id: "neon-street-rain", kind: "video", aspect: "9:16", category: "cinematic",
    query: "neon city street night rain", orientation: "portrait",
    prompt: "A rain-slicked neon street at night, camera pushing slowly forward past glowing signage. Reflections smear across the wet asphalt. Moody, saturated, cinematic.",
    tags: ["neon", "city", "night", "rain", "street", "reflections", "cinematic"],
  },
  {
    id: "portrait-wind-hair", kind: "video", aspect: "9:16", category: "people",
    query: "woman portrait hair wind", orientation: "portrait",
    prompt: "Close portrait of a woman as wind lifts her hair, she turns slowly toward the lens. Soft directional daylight, shallow depth of field, calm and intimate.",
    tags: ["portrait", "woman", "hair", "wind", "close-up", "soft light"],
  },
  {
    id: "dancer-silhouette", kind: "video", aspect: "9:16", category: "motion",
    query: "dancer dancing silhouette studio", orientation: "portrait",
    prompt: "A dancer moving through a slow spin, body caught in a single hard light against darkness. Camera holds steady, motion blur trails the limbs. Dramatic and graphic.",
    tags: ["dancer", "dance", "movement", "silhouette", "studio", "motion"],
  },
  {
    id: "skate-street-run", kind: "video", aspect: "9:16", category: "motion",
    query: "skateboarding street skate", orientation: "portrait",
    prompt: "A skateboarder rolls through an empty concrete plaza, camera tracking alongside at knee height. Late afternoon sun, long shadows, loose documentary energy.",
    tags: ["skateboard", "skate", "street", "motion", "urban", "tracking shot"],
  },
  {
    id: "waterfall-forest-drop", kind: "video", aspect: "9:16", category: "nature",
    query: "waterfall forest rocks", orientation: "portrait",
    prompt: "Water falls through mossy rock into a dark pool, shot straight on from close range. Fine mist catches the light. Cool green palette, slow and hypnotic.",
    tags: ["waterfall", "forest", "water", "moss", "nature", "green"],
  },
  {
    id: "night-walk-city", kind: "video", aspect: "9:16", category: "cinematic",
    query: "person walking city street night lights", orientation: "portrait",
    prompt: "A figure walks away down a night street, city lights blooming out of focus behind them. Handheld follow, warm streetlight against cool shadow.",
    tags: ["night", "city", "walking", "bokeh", "street", "cinematic"],
  },
  {
    id: "ocean-waves-vertical", kind: "video", aspect: "9:16", category: "nature",
    query: "ocean waves sea water", orientation: "portrait",
    prompt: "Ocean swell rolls and breaks, filmed from just above the waterline in slow motion. Foam spreads across deep blue-green. Weighty and meditative.",
    tags: ["ocean", "waves", "sea", "water", "slow motion", "blue"],
  },
  {
    id: "street-fashion-walk", kind: "video", aspect: "9:16", category: "people",
    query: "fashion model walking street style", orientation: "portrait",
    prompt: "A person in a long coat walks toward camera down a city pavement, coat moving with each step. Overcast light, muted palette, editorial and confident.",
    tags: ["fashion", "street style", "walking", "coat", "editorial", "city"],
  },
  {
    id: "ink-water-vertical", kind: "video", aspect: "9:16", category: "abstract",
    query: "ink in water abstract", orientation: "portrait",
    prompt: "Ink blooms and curls through clear water, backlit against black. Tendrils unfurl in slow motion. Abstract, organic, high contrast.",
    tags: ["ink", "water", "abstract", "smoke", "slow motion", "black"],
  },
  {
    id: "fireworks-night-sky", kind: "video", aspect: "9:16", category: "abstract",
    query: "fireworks night sky", orientation: "portrait",
    prompt: "Fireworks open across a black sky, sparks drifting down in long trails. Locked-off wide, deep shadow, bursts of warm colour.",
    tags: ["fireworks", "night", "sky", "lights", "celebration", "sparks"],
  },

  // --- videos, 16:9 ---
  {
    id: "drone-mountain-ridge", kind: "video", aspect: "16:9", category: "nature",
    query: "aerial drone mountains landscape", orientation: "landscape",
    prompt: "Aerial push across a mountain ridge, cloud sitting in the valleys below. Early light rakes the slopes. Vast, still, epic in scale.",
    tags: ["drone", "aerial", "mountains", "ridge", "clouds", "landscape"],
  },
  {
    id: "coast-cliffs-aerial", kind: "video", aspect: "16:9", category: "nature",
    query: "aerial coastline cliffs ocean", orientation: "landscape",
    prompt: "Drone glides along a cliff edge where surf meets rock, water turning turquoise in the shallows. Bright midday sun, wide and sweeping.",
    tags: ["coast", "cliffs", "aerial", "ocean", "drone", "turquoise"],
  },
  {
    id: "forest-fog-morning", kind: "video", aspect: "16:9", category: "nature",
    query: "foggy forest mist trees", orientation: "landscape",
    prompt: "Fog drifts between tall pines, camera creeping forward at eye level. Light filters through in soft shafts. Muted greens, quiet and eerie.",
    tags: ["forest", "fog", "mist", "trees", "morning", "atmospheric"],
  },
  {
    id: "desert-dunes-wind", kind: "video", aspect: "16:9", category: "nature",
    query: "desert sand dunes", orientation: "landscape",
    prompt: "Wind lifts sand off the crest of a dune, ridgelines curving away to the horizon. Low sun carves hard shadow into the slopes. Warm, minimal, patient.",
    tags: ["desert", "dunes", "sand", "wind", "golden hour", "minimal"],
  },
  {
    id: "snow-falling-pines", kind: "video", aspect: "16:9", category: "nature",
    query: "snow falling winter forest", orientation: "landscape",
    prompt: "Snow falls steadily through a stand of dark pines, flakes catching the light as they pass. Static wide, cold blue-grey, hushed.",
    tags: ["snow", "winter", "pines", "forest", "cold", "falling"],
  },
  {
    id: "car-night-drive", kind: "video", aspect: "16:9", category: "cinematic",
    query: "car driving night city road lights", orientation: "landscape",
    prompt: "A car moves through city streets after dark, headlights and signage streaking past the windows. Tracking alongside, deep blacks, neon spill.",
    tags: ["car", "night", "driving", "city", "lights", "cinematic"],
  },
  {
    id: "ocean-slow-motion", kind: "video", aspect: "16:9", category: "nature",
    query: "ocean wave slow motion water", orientation: "landscape",
    prompt: "A wave curls and collapses in slow motion, spray hanging in the air at the lip. Backlit so the water glows green. Powerful and weightless at once.",
    tags: ["ocean", "wave", "slow motion", "spray", "backlit", "water"],
  },
  {
    id: "stars-night-sky", kind: "video", aspect: "16:9", category: "cinematic",
    query: "night sky stars milky way timelapse", orientation: "landscape",
    prompt: "The Milky Way wheels slowly overhead in timelapse, horizon dark and low in frame. Dense starfield, cold blue, enormous and silent.",
    tags: ["stars", "night sky", "milky way", "timelapse", "space", "astro"],
  },
  {
    id: "rain-on-glass", kind: "video", aspect: "16:9", category: "abstract",
    query: "rain drops on window glass", orientation: "landscape",
    prompt: "Raindrops gather and run down a pane of glass, the world beyond thrown far out of focus. Macro, soft grey light, intimate and still.",
    tags: ["rain", "glass", "window", "droplets", "macro", "bokeh"],
  },
  {
    id: "city-traffic-timelapse", kind: "video", aspect: "16:9", category: "cinematic",
    query: "city timelapse night traffic lights", orientation: "landscape",
    prompt: "Traffic streams into light trails across a city intersection in timelapse, towers lit behind. High wide angle, saturated reds and ambers.",
    tags: ["city", "timelapse", "traffic", "light trails", "night", "urban"],
  },

  // --- videos, 1:1 ---
  {
    id: "coffee-pour-square", kind: "video", aspect: "1:1", category: "product",
    query: "coffee pouring cup close up",
    prompt: "Coffee streams into a ceramic cup, crema swirling as it fills. Tight overhead macro, warm side light, rich browns against matte stone.",
    tags: ["coffee", "pour", "drink", "macro", "product", "warm"],
  },
  {
    id: "perfume-bottle-square", kind: "video", aspect: "1:1", category: "product",
    query: "perfume bottle studio product",
    prompt: "A glass bottle rotates slowly on a dark plinth, light raking across its facets. Studio lighting, deep shadow, premium and restrained.",
    tags: ["perfume", "bottle", "glass", "studio", "product", "rotating"],
  },
  {
    id: "drink-splash-square", kind: "video", aspect: "1:1", category: "product",
    query: "drink splash water glass",
    prompt: "Liquid splashes up the inside of a glass in slow motion, droplets suspended mid-air. Hard backlight, crisp highlights, clean and graphic.",
    tags: ["drink", "splash", "liquid", "glass", "slow motion", "product"],
  },
  {
    id: "smoke-abstract-square", kind: "video", aspect: "1:1", category: "abstract",
    query: "smoke abstract dark background",
    prompt: "Smoke curls upward through a single beam of light against black. Slow, continuous motion, monochrome, textural and abstract.",
    tags: ["smoke", "abstract", "dark", "light beam", "monochrome", "texture"],
  },

  // --- images, 1:1 ---
  {
    id: "img-perfume-square", kind: "image", aspect: "1:1", category: "product",
    query: "perfume bottle product still life",
    prompt: "A frosted glass bottle on a stone surface, lit from one side so the edge catches. Deep shadow, muted palette, quiet luxury still life.",
    tags: ["perfume", "bottle", "still life", "product", "studio", "minimal"],
  },
  {
    id: "img-watch-square", kind: "image", aspect: "1:1", category: "product",
    query: "wristwatch macro detail",
    prompt: "Macro detail of a watch face, light grazing the dial texture. Extremely shallow focus, cool metal tones, precise and tactile.",
    tags: ["watch", "macro", "detail", "metal", "product", "close-up"],
  },
  {
    id: "img-coffee-square", kind: "image", aspect: "1:1", category: "product",
    query: "coffee cup flat lay table",
    prompt: "Overhead flat lay of a coffee cup on a worn wooden table, morning light falling across from the left. Warm, simple, editorial.",
    tags: ["coffee", "flat lay", "overhead", "table", "morning", "warm"],
  },
  {
    id: "img-ink-square", kind: "image", aspect: "1:1", category: "abstract",
    query: "ink in water abstract colour",
    prompt: "Ink suspended in water, frozen mid-bloom against a dark field. Fine filaments and soft edges. Abstract, saturated, organic.",
    tags: ["ink", "water", "abstract", "bloom", "colour", "dark"],
  },
  {
    id: "img-city-bokeh-square", kind: "image", aspect: "1:1", category: "abstract",
    query: "city lights bokeh night blur",
    prompt: "City lights thrown completely out of focus into overlapping discs of colour. Night, no subject, pure texture and glow.",
    tags: ["bokeh", "city lights", "night", "blur", "abstract", "glow"],
  },

  // --- images, 4:5 ---
  {
    id: "img-portrait-wind", kind: "image", aspect: "4:5", category: "people",
    query: "portrait woman wind hair outdoor",
    prompt: "A woman outdoors with hair caught mid-movement, looking just past the lens. Overcast light, soft contrast, natural and unposed.",
    tags: ["portrait", "woman", "wind", "hair", "outdoor", "natural light"],
  },
  {
    id: "img-street-fashion", kind: "image", aspect: "4:5", category: "people",
    query: "street style fashion outfit city",
    prompt: "Full-length street style frame against a plain city wall, strong silhouette, confident stance. Flat overcast light, muted tones, editorial.",
    tags: ["fashion", "street style", "outfit", "city", "editorial", "full length"],
  },
  {
    id: "img-desert-figure", kind: "image", aspect: "4:5", category: "cinematic",
    query: "desert dunes landscape person walking",
    prompt: "A lone figure crosses a vast dune field, tiny against the ridgeline. Late sun, long shadow, scale-driven and cinematic.",
    tags: ["desert", "dunes", "figure", "scale", "golden hour", "cinematic"],
  },

  // --- images, 3:4 ---
  {
    id: "img-forest-fog", kind: "image", aspect: "3:4", category: "nature",
    query: "foggy forest trees mist",
    prompt: "Tall trunks fading back into fog, layer on layer. Diffused grey light, desaturated greens, still and quiet.",
    tags: ["forest", "fog", "mist", "trees", "layers", "muted"],
  },
  {
    id: "img-snow-trees", kind: "image", aspect: "3:4", category: "nature",
    query: "snow covered trees winter landscape",
    prompt: "Snow-laden branches against a pale winter sky, weight pulling the boughs down. Cold blue-white, high key, minimal.",
    tags: ["snow", "trees", "winter", "cold", "minimal", "high key"],
  },
  {
    id: "img-mountain-lake", kind: "image", aspect: "3:4", category: "nature",
    query: "mountain lake reflection landscape",
    prompt: "A still alpine lake mirroring the peaks above it, not a ripple on the surface. Cool dawn light, perfect symmetry, serene.",
    tags: ["mountain", "lake", "reflection", "alpine", "dawn", "symmetry"],
  },

  // --- images, 16:9 ---
  {
    id: "img-coast-aerial", kind: "image", aspect: "16:9", category: "nature",
    query: "aerial coastline beach ocean above",
    prompt: "Straight-down aerial of surf meeting sand, water grading from white to deep blue. Bright sun, graphic and abstracted.",
    tags: ["aerial", "coast", "beach", "ocean", "top down", "blue"],
  },
  {
    id: "img-night-skyline", kind: "image", aspect: "16:9", category: "cinematic",
    query: "city skyline night lights panorama",
    prompt: "A city skyline after dark, windows and signage scattered across the towers. Long exposure, deep blue hour, wide and expansive.",
    tags: ["skyline", "city", "night", "lights", "long exposure", "blue hour"],
  },
  {
    id: "img-stars-landscape", kind: "image", aspect: "16:9", category: "cinematic",
    query: "milky way stars night sky landscape",
    prompt: "The Milky Way arcing over a dark horizon, stars dense from edge to edge. Long exposure, cold tones, vast and silent.",
    tags: ["stars", "milky way", "night", "astro", "long exposure", "landscape"],
  },

  // --- images, 9:16 ---
  {
    id: "img-neon-alley", kind: "image", aspect: "9:16", category: "cinematic",
    query: "neon signs alley night city",
    prompt: "A narrow alley stacked with neon signage, colour bleeding onto wet ground. Night, heavy saturation, dense and atmospheric.",
    tags: ["neon", "alley", "night", "signs", "saturated", "city"],
  },
  {
    id: "img-waterfall-tall", kind: "image", aspect: "9:16", category: "nature",
    query: "waterfall tropical jungle tall",
    prompt: "A thin waterfall dropping down a green rock face, spray softening the base. Long exposure smooths the water. Lush and cool.",
    tags: ["waterfall", "jungle", "tropical", "green", "long exposure", "water"],
  },
  {
    id: "img-smoke-tall", kind: "image", aspect: "9:16", category: "abstract",
    query: "smoke abstract dark vertical",
    prompt: "A single column of smoke rising and breaking apart against black. Side-lit, monochrome, sculptural.",
    tags: ["smoke", "abstract", "dark", "vertical", "monochrome", "sculptural"],
  },
];

// ---------------------------------------------------------------------------

type PexelsVideoFile = {
  id: number;
  quality: string | null;
  file_type: string;
  width: number | null;
  height: number | null;
  link: string;
};

type PexelsVideo = {
  id: number;
  width: number;
  height: number;
  duration: number;
  url: string;
  image: string;
  user: { name: string; url: string };
  video_files: PexelsVideoFile[];
};

type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  url: string;
  alt: string | null;
  photographer: string;
  photographer_url: string;
  src: Record<string, string>;
};

function requireKey(): string {
  const key = process.env.PEXELS_API_KEY?.trim();
  if (!key) {
    console.error(
      [
        "PEXELS_API_KEY is not set.",
        "",
        "Put it in .env.local at the repo root (Bun loads that automatically):",
        "  PEXELS_API_KEY=your_key_here",
        "",
        "Get one free at https://www.pexels.com/api/. The key is only used by",
        "this script - the app never calls Pexels at runtime.",
      ].join("\n"),
    );
    process.exit(1);
  }
  return key;
}

async function pexels<T>(url: string, key: string): Promise<T> {
  const response = await fetch(url, { headers: { Authorization: key } });
  if (response.status === 429) {
    throw new Error("Pexels rate limit hit (200/hour). Wait and re-run.");
  }
  if (!response.ok) {
    throw new Error(`Pexels ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as T;
}

function isBlocked(text: string | null | undefined): boolean {
  if (!text) return false;
  const haystack = text.toLowerCase();
  return BLOCKED_WORDS.some((word) =>
    new RegExp(`\\b${word}\\b`).test(haystack),
  );
}

/** Can this source be center-cropped to the target aspect without upscaling? */
function coversAspect(
  width: number,
  height: number,
  aspect: Aspect,
  kind: "video" | "image",
): boolean {
  const dims =
    kind === "video"
      ? ASPECT_DIMENSIONS[aspect].video
      : ASPECT_DIMENSIONS[aspect].image;
  if (!dims) return false;
  const target = dims.width / dims.height;
  const source = width / height;
  // Cropping only removes pixels, so the source must be big enough in the
  // dimension that survives the crop.
  return source >= target
    ? height >= dims.height
    : width >= dims.width;
}

/** Smallest file that is still big enough, to keep the download light. */
function pickVideoFile(video: PexelsVideo, aspect: Aspect) {
  return video.video_files
    .filter((file) => file.file_type === "video/mp4" && file.width && file.height)
    .filter((file) => coversAspect(file.width!, file.height!, aspect, "video"))
    .sort((a, b) => a.width! * a.height! - b.width! * b.height!)[0];
}

type Candidate = {
  slotId: string;
  pexelsId: number;
  width: number;
  height: number;
  durationSec?: number;
  author: string;
  authorUrl: string;
  pageUrl: string;
  previewUrl: string;
  downloadUrl: string;
  rejected?: string;
};

async function findVideo(slot: Slot, key: string): Promise<Candidate[]> {
  const params = new URLSearchParams({
    query: slot.query,
    per_page: "15",
    size: "medium",
  });
  if (slot.orientation) params.set("orientation", slot.orientation);

  const data = await pexels<{ videos: PexelsVideo[] }>(
    `https://api.pexels.com/videos/search?${params}`,
    key,
  );

  return data.videos.map((video) => {
    const file = pickVideoFile(video, slot.aspect);
    const base: Candidate = {
      slotId: slot.id,
      pexelsId: video.id,
      width: video.width,
      height: video.height,
      durationSec: video.duration,
      author: video.user.name,
      authorUrl: video.user.url,
      pageUrl: video.url,
      previewUrl: video.image,
      downloadUrl: file?.link ?? "",
    };
    if (!file) return { ...base, rejected: "no file large enough to crop" };
    // Under 3s loops badly; over 60s is a heavy download for a 10s trim.
    if (video.duration < 3) return { ...base, rejected: "too short" };
    if (video.duration > 60) return { ...base, rejected: "too long" };
    return base;
  });
}

async function findPhoto(slot: Slot, key: string): Promise<Candidate[]> {
  const params = new URLSearchParams({ query: slot.query, per_page: "15" });
  if (slot.orientation) params.set("orientation", slot.orientation);

  const data = await pexels<{ photos: PexelsPhoto[] }>(
    `https://api.pexels.com/v1/search?${params}`,
    key,
  );

  return data.photos.map((photo) => {
    const base: Candidate = {
      slotId: slot.id,
      pexelsId: photo.id,
      width: photo.width,
      height: photo.height,
      author: photo.photographer,
      authorUrl: photo.photographer_url,
      pageUrl: photo.url,
      previewUrl: photo.src.medium ?? photo.src.original,
      downloadUrl: photo.src.original,
    };
    if (isBlocked(photo.alt)) {
      return { ...base, rejected: `alt text matched a blocked word` };
    }
    if (!coversAspect(photo.width, photo.height, slot.aspect, "image")) {
      return { ...base, rejected: "too small to crop to aspect" };
    }
    return base;
  });
}

async function download(url: string, dest: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`download failed ${response.status} for ${url}`);
  }
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(await response.arrayBuffer()));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlyArg = args.find((arg) => arg.startsWith("--only="));
  const only = onlyArg ? new Set(onlyArg.slice(7).split(",")) : undefined;

  const key = requireKey();
  const slots = only ? SLOTS.filter((slot) => only.has(slot.id)) : SLOTS;

  console.log(`Fetching ${slots.length} slots from Pexels${dryRun ? " (dry run)" : ""}\n`);

  const allCandidates: Candidate[] = [];
  const manifest: Sample[] = [];
  const failures: string[] = [];

  for (const slot of slots) {
    process.stdout.write(`  ${slot.id.padEnd(26)} `);
    try {
      const candidates =
        slot.kind === "video"
          ? await findVideo(slot, key)
          : await findPhoto(slot, key);
      allCandidates.push(...candidates);

      const chosen = candidates.find((candidate) => !candidate.rejected);
      if (!chosen) {
        console.log("NO USABLE RESULT");
        failures.push(`${slot.id}: no usable result for "${slot.query}"`);
        continue;
      }

      const dims =
        slot.kind === "video"
          ? ASPECT_DIMENSIONS[slot.aspect].video!
          : ASPECT_DIMENSIONS[slot.aspect].image;

      manifest.push({
        id: slot.id,
        kind: slot.kind,
        src:
          slot.kind === "video"
            ? `/samples/videos/${slot.id}.mp4`
            : `/samples/images/${slot.id}.webp`,
        ...(slot.kind === "video"
          ? { poster: `/samples/posters/${slot.id}.jpg` }
          : {}),
        width: dims.width,
        height: dims.height,
        aspect: slot.aspect,
        ...(slot.kind === "video"
          ? { durationSec: Math.min(10, chosen.durationSec ?? 10) }
          : {}),
        prompt: slot.prompt,
        tags: slot.tags,
        category: slot.category,
        credit: {
          author: chosen.author,
          source: "Pexels",
          sourceUrl: chosen.pageUrl,
          ...PEXELS_LICENSE,
        },
      });

      if (dryRun) {
        console.log(`would take #${chosen.pexelsId} by ${chosen.author}`);
      } else {
        const ext = slot.kind === "video" ? "mp4" : "jpg";
        const folder = slot.kind === "video" ? "videos" : "images";
        await download(
          chosen.downloadUrl,
          path.join(RAW_DIR, folder, `${slot.id}.${ext}`),
        );
        console.log(`#${chosen.pexelsId} by ${chosen.author}`);
      }
    } catch (error) {
      console.log("ERROR");
      failures.push(`${slot.id}: ${(error as Error).message}`);
    }
  }

  await mkdir(RAW_DIR, { recursive: true });
  await writeFile(
    path.join(RAW_DIR, "candidates.json"),
    JSON.stringify(allCandidates, null, 2),
  );

  if (!dryRun && manifest.length > 0) {
    // Keep manifest order stable and grouped: videos first, then images.
    const order = SLOTS.map((slot) => slot.id);
    manifest.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`\nWrote ${manifest.length} entries to ${MANIFEST_PATH}`);
  }

  console.log(`Wrote ${allCandidates.length} candidates to ${RAW_DIR}/candidates.json`);

  if (failures.length > 0) {
    console.error(`\n${failures.length} slot(s) failed:`);
    for (const failure of failures) console.error(`  - ${failure}`);
    console.error(
      "\nRe-run just those with --only=<id>,<id> after tweaking their query.",
    );
    process.exit(1);
  }

  console.log("\nNext: bun run samples:prepare");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

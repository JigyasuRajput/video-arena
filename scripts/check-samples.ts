/**
 * Validate the sample manifest against what is actually on disk.
 *
 *   bun run samples:check
 *
 * Run it before committing. ffprobe is used to confirm real dimensions and
 * duration when it's available; without it those checks are skipped with a
 * warning rather than silently passing.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import type { Aspect, Sample } from "../src/lib/samples";
import manifest from "../src/data/samples.json";

const PUBLIC_DIR = "public";
const SAMPLES_DIR = path.join(PUBLIC_DIR, "samples");

const MAX_VIDEO_BYTES = 6 * 1024 * 1024;
const MAX_IMAGE_BYTES = 400 * 1024;
const MAX_POSTER_BYTES = 300 * 1024;
const MAX_TOTAL_BYTES = 80 * 1024 * 1024;
const MAX_DURATION_SEC = 10;

/** Aspects the create forms offer, so the mock generator always has stock. */
const VIDEO_FORM_ASPECTS: Aspect[] = ["16:9", "9:16", "1:1"];
const IMAGE_FORM_ASPECTS: Aspect[] = ["1:1", "4:5", "3:4", "16:9", "9:16"];
const MIN_PER_ASPECT = 2;

const samples = manifest as Sample[];
const errors: string[] = [];
const warnings: string[] = [];

function mb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function hasFfprobe(): boolean {
  try {
    execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function probe(file: string) {
  const raw = execFileSync(
    "ffprobe",
    [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height:format=duration",
      "-of", "json",
      file,
    ],
    { encoding: "utf8" },
  );
  const parsed = JSON.parse(raw) as {
    streams?: { width?: number; height?: number }[];
    format?: { duration?: string };
  };
  return {
    width: parsed.streams?.[0]?.width,
    height: parsed.streams?.[0]?.height,
    duration: parsed.format?.duration
      ? Number(parsed.format.duration)
      : undefined,
  };
}

function aspectRatio(aspect: Aspect): number {
  const [w, h] = aspect.split(":").map(Number);
  return w / h;
}

function main() {
  if (samples.length === 0) {
    console.error(
      "Manifest is empty. Run 'bun run samples:fetch' then 'bun run samples:prepare'.",
    );
    process.exit(1);
  }

  const ffprobeAvailable = hasFfprobe();
  if (!ffprobeAvailable) {
    warnings.push(
      "ffprobe not found - skipped real dimension and duration checks.",
    );
  }

  // --- duplicate ids ---
  const seen = new Set<string>();
  for (const sample of samples) {
    if (seen.has(sample.id)) errors.push(`duplicate id: ${sample.id}`);
    seen.add(sample.id);
  }

  const expectedFiles = new Set<string>();
  let totalBytes = 0;

  for (const sample of samples) {
    const label = sample.id;

    // --- credit ---
    if (!sample.credit?.author) errors.push(`${label}: missing credit author`);
    if (!sample.credit?.sourceUrl) errors.push(`${label}: missing credit sourceUrl`);
    if (!sample.credit?.licenseUrl) errors.push(`${label}: missing licenseUrl`);
    if (sample.credit?.sourceUrl && !/^https?:\/\//.test(sample.credit.sourceUrl)) {
      errors.push(`${label}: sourceUrl is not a URL`);
    }

    // --- prompt / tags ---
    if (!sample.prompt?.trim()) errors.push(`${label}: missing prompt idea`);
    if (!sample.tags?.length) errors.push(`${label}: no tags`);

    // --- declared aspect matches declared dimensions ---
    const declared = sample.width / sample.height;
    if (Math.abs(declared - aspectRatio(sample.aspect)) > 0.02) {
      errors.push(
        `${label}: ${sample.width}x${sample.height} is not ${sample.aspect}`,
      );
    }

    // --- src file ---
    const srcPath = path.join(PUBLIC_DIR, sample.src);
    expectedFiles.add(path.normalize(srcPath));
    if (!existsSync(srcPath)) {
      errors.push(`${label}: missing file ${sample.src}`);
      continue;
    }

    const srcBytes = statSync(srcPath).size;
    totalBytes += srcBytes;
    const cap = sample.kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (srcBytes > cap) {
      errors.push(`${label}: ${mb(srcBytes)} exceeds cap of ${mb(cap)}`);
    }

    // --- poster (videos only) ---
    if (sample.kind === "video") {
      if (!sample.poster) {
        errors.push(`${label}: video has no poster`);
      } else {
        const posterPath = path.join(PUBLIC_DIR, sample.poster);
        expectedFiles.add(path.normalize(posterPath));
        if (!existsSync(posterPath)) {
          errors.push(`${label}: missing poster ${sample.poster}`);
        } else {
          const posterBytes = statSync(posterPath).size;
          totalBytes += posterBytes;
          if (posterBytes > MAX_POSTER_BYTES) {
            errors.push(
              `${label}: poster ${mb(posterBytes)} exceeds ${mb(MAX_POSTER_BYTES)}`,
            );
          }
        }
      }
      if (sample.durationSec === undefined) {
        errors.push(`${label}: video has no durationSec`);
      } else if (sample.durationSec > MAX_DURATION_SEC) {
        errors.push(`${label}: durationSec ${sample.durationSec} exceeds 10`);
      }
    } else if (sample.poster) {
      errors.push(`${label}: image should not have a poster`);
    }

    // --- real file vs manifest ---
    if (ffprobeAvailable) {
      try {
        const actual = probe(srcPath);
        if (actual.width !== sample.width || actual.height !== sample.height) {
          errors.push(
            `${label}: file is ${actual.width}x${actual.height}, manifest says ${sample.width}x${sample.height}`,
          );
        }
        if (sample.kind === "video" && actual.duration !== undefined) {
          if (actual.duration > MAX_DURATION_SEC + 0.5) {
            errors.push(
              `${label}: file runs ${actual.duration.toFixed(1)}s, over the 10s cap`,
            );
          }
          if (
            sample.durationSec !== undefined &&
            Math.abs(actual.duration - sample.durationSec) > 1.5
          ) {
            warnings.push(
              `${label}: manifest says ${sample.durationSec}s, file is ${actual.duration.toFixed(1)}s`,
            );
          }
        }
      } catch (error) {
        errors.push(`${label}: ffprobe failed - ${(error as Error).message}`);
      }
    }
  }

  // --- orphans ---
  if (existsSync(SAMPLES_DIR)) {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        if (entry.name === ".gitkeep") return [];
        return [path.normalize(full)];
      });
    for (const file of walk(SAMPLES_DIR)) {
      if (!expectedFiles.has(file)) {
        errors.push(`orphan file not in manifest: ${file}`);
      }
    }
  }

  // --- total size ---
  if (totalBytes > MAX_TOTAL_BYTES) {
    errors.push(`total ${mb(totalBytes)} exceeds ${mb(MAX_TOTAL_BYTES)}`);
  }

  // --- coverage, so the mock generator always has something to return ---
  const countFor = (kind: "video" | "image", aspect: Aspect) =>
    samples.filter((s) => s.kind === kind && s.aspect === aspect).length;

  for (const aspect of VIDEO_FORM_ASPECTS) {
    const n = countFor("video", aspect);
    if (n < MIN_PER_ASPECT) {
      errors.push(`only ${n} video(s) at ${aspect}, need at least ${MIN_PER_ASPECT}`);
    }
  }
  for (const aspect of IMAGE_FORM_ASPECTS) {
    const n = countFor("image", aspect);
    if (n < MIN_PER_ASPECT) {
      errors.push(`only ${n} image(s) at ${aspect}, need at least ${MIN_PER_ASPECT}`);
    }
  }

  // --- report ---
  const videos = samples.filter((s) => s.kind === "video").length;
  const images = samples.filter((s) => s.kind === "image").length;
  console.log(
    `${samples.length} samples (${videos} videos, ${images} images), ${mb(totalBytes)} on disk`,
  );

  for (const warning of warnings) console.warn(`  warn: ${warning}`);

  if (errors.length > 0) {
    console.error(`\n${errors.length} problem(s):`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log("All checks passed.");
}

main();

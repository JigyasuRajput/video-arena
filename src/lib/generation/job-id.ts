import { createHmac, timingSafeEqual } from "node:crypto";

import type { GenerationKind } from "@/lib/generation/types";

/**
 * Self-contained job ids.
 *
 * Vercel functions don't share memory and there is no database here, so a job
 * table would break the moment two requests landed on different instances.
 * Instead the id *is* the job: everything needed to answer "how far along is
 * this?" is encoded in it, and the answer is derived from elapsed time. That
 * also means a page refresh mid-generation picks straight back up, because the
 * id in the client's store is still the whole truth.
 *
 * The HMAC exists so the payload can't be hand-edited into, say, a completed
 * job pointing at an arbitrary sample id.
 */

export type JobPayload = {
  /** kind */
  k: GenerationKind;
  /** sample ids the job will return (1 for video, `count` for image) */
  s: string[];
  /** createdAt, epoch ms */
  c: number;
  /** total eta in ms, queue phase included */
  e: number;
  /** dev-only: this job is meant to fail, see the [fail] escape hatch */
  f?: 1;
};

/**
 * Hardcoded fallback so the app runs with zero env vars, which is a hard
 * requirement for this build. Set JOB_SECRET in production anyway - the only
 * thing it protects is "don't let people forge a job id", but there's no
 * reason to leave that open.
 */
const DEV_FALLBACK_SECRET = "video-arena-dev-job-secret";

const SIG_LENGTH = 22;

function secret(): string {
  return process.env.JOB_SECRET || DEV_FALLBACK_SECRET;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input as never).toString("base64url");
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url").slice(0, SIG_LENGTH);
}

export function encodeJobId(payload: JobPayload): string {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function decodeJobId(jobId: string): JobPayload | null {
  const dot = jobId.lastIndexOf(".");
  if (dot <= 0) return null;

  const body = jobId.slice(0, dot);
  const given = jobId.slice(dot + 1);
  const expected = sign(body);

  // timingSafeEqual throws on a length mismatch, so guard first.
  if (given.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(given), Buffer.from(expected))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as JobPayload;
    if (
      (parsed.k !== "video" && parsed.k !== "image") ||
      !Array.isArray(parsed.s) ||
      typeof parsed.c !== "number" ||
      typeof parsed.e !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

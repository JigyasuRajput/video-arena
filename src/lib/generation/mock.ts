import { decodeJobId, encodeJobId } from "@/lib/generation/job-id";
import { pickSampleIds } from "@/lib/generation/pick";
import {
  failAtMs,
  hashString,
  imageEtaMs,
  progressAt,
  videoEtaMs,
} from "@/lib/generation/timing";
import type {
  GenerationProvider,
  GenerationRequest,
  JobStatus,
} from "@/lib/generation/types";

/**
 * The simulated provider.
 *
 * It never calls a model. `submit` decides up front which stock sample the job
 * will return and how long it should appear to take, bakes both into the job
 * id, and `status` derives the rest from the clock. There is no state anywhere.
 */

/** Never random. Only the dev [fail] escape hatch reaches these. */
const FAILURE_MESSAGES = [
  "The model returned an empty result. Try a more specific prompt.",
  "Generation timed out upstream after 60s. Nothing was charged.",
  "The request was rejected by the safety filter. Try rephrasing the prompt.",
];

const FAIL_TOKEN = "[fail]";

function shouldFail(prompt: string): boolean {
  // Production never fails. This exists so the error UI can be exercised.
  return (
    process.env.NODE_ENV !== "production" &&
    prompt.toLowerCase().includes(FAIL_TOKEN)
  );
}

export const mockProvider: GenerationProvider = {
  async submit(req: GenerationRequest) {
    const hash = hashString(`${req.prompt.trim().toLowerCase()}|${req.seed ?? 0}`);
    const count = req.kind === "image" ? req.count : 1;

    const sampleIds = pickSampleIds({
      kind: req.kind,
      aspect: req.aspect,
      prompt: req.prompt,
      seed: req.seed,
      count,
    });

    const etaMs =
      req.kind === "video"
        ? videoEtaMs(req.duration, req.resolution, hash)
        : imageEtaMs(req.count, req.quality, req.resolution, hash);

    const jobId = encodeJobId({
      k: req.kind,
      s: sampleIds,
      c: Date.now(),
      e: etaMs,
      ...(shouldFail(req.prompt) ? { f: 1 as const } : {}),
    });

    return { jobId, etaMs };
  },

  async status(jobId: string): Promise<JobStatus> {
    const payload = decodeJobId(jobId);
    if (!payload) {
      return { status: "failed", progress: 0, error: "Unknown or tampered job id." };
    }

    const elapsed = Date.now() - payload.c;

    if (payload.f) {
      const giveUp = failAtMs(payload.e);
      if (elapsed >= giveUp) {
        const message = FAILURE_MESSAGES[hashString(jobId) % FAILURE_MESSAGES.length];
        return { status: "failed", progress: Math.round(progressAt(giveUp, payload.e).progress), error: message };
      }
    }

    const { state, progress } = progressAt(elapsed, payload.e);
    if (state === "completed") {
      return { status: "completed", progress: 100, result: { sampleIds: payload.s } };
    }
    return { status: state, progress };
  },
};

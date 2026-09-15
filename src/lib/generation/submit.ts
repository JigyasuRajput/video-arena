import { z } from "zod";

import { getProvider } from "@/lib/generation";
import type {
  GenerationKind,
  GenerationRequest,
  ImageRequest,
  VideoRequest,
} from "@/lib/generation/types";
import { getImageModel, getVideoModel } from "@/lib/models";

/**
 * Request validation, shared by /api/generate/video and /api/generate/image.
 *
 * Two layers, because they catch different things: zod checks the shape, then
 * `checkCapabilities` checks the combination against the model catalogue. A
 * body can be perfectly well-formed and still ask Veo for 5 seconds, and the
 * client is not the place that gets to decide that's fine.
 */

const ASPECTS = ["16:9", "9:16", "1:1", "4:5", "3:4"] as const;

const promptField = z
  .string()
  .trim()
  .min(3, "Prompt needs at least 3 characters.")
  .max(1500, "Prompt is limited to 1500 characters.");

const videoBody = z.object({
  model: z.string().min(1),
  prompt: promptField,
  duration: z.number().int().positive(),
  aspect: z.enum(ASPECTS),
  resolution: z.enum(["480p", "720p", "1080p"]),
  audio: z.boolean(),
  hasStartFrame: z.boolean(),
  hasEndFrame: z.boolean(),
  refCount: z.number().int().min(0).max(3),
  seed: z.number().int().optional(),
});

const imageBody = z.object({
  model: z.string().min(1),
  prompt: promptField,
  aspect: z.enum(ASPECTS),
  quality: z.enum(["standard", "high"]),
  resolution: z.enum(["1K", "2K"]),
  count: z.number().int().min(1).max(4),
  refCount: z.number().int().min(0).max(4),
  seed: z.number().int().optional(),
});

export type SubmitResult =
  | { ok: true; jobId: string; etaMs: number }
  | { ok: false; status: number; error: string };

function invalid(error: string): SubmitResult {
  return { ok: false, status: 400, error };
}

function checkVideo(req: VideoRequest): string | null {
  const model = getVideoModel(req.model);
  if (!model) return `Unknown model "${req.model}".`;
  if (!model.durations.includes(req.duration)) {
    return `${model.name} does not support ${req.duration}s. Supported: ${model.durations.join("s, ")}s.`;
  }
  if (!model.aspects.includes(req.aspect)) {
    return `${model.name} does not support ${req.aspect}. Supported: ${model.aspects.join(", ")}.`;
  }
  if (!model.resolutions.includes(req.resolution)) {
    return `${model.name} does not support ${req.resolution}. Supported: ${model.resolutions.join(", ")}.`;
  }
  if (req.audio && !model.audio) return `${model.name} does not generate audio.`;
  if (req.hasStartFrame && !model.startFrame) return `${model.name} does not take a start frame.`;
  if (req.hasEndFrame && !model.endFrame) return `${model.name} does not take an end frame.`;
  if (req.refCount > model.maxRefs) {
    return model.maxRefs === 0
      ? `${model.name} does not take reference images.`
      : `${model.name} takes at most ${model.maxRefs} reference image${model.maxRefs === 1 ? "" : "s"}.`;
  }
  return null;
}

function checkImage(req: ImageRequest): string | null {
  const model = getImageModel(req.model);
  if (!model) return `Unknown model "${req.model}".`;
  if (!model.aspects.includes(req.aspect)) {
    return `${model.name} does not support ${req.aspect}. Supported: ${model.aspects.join(", ")}.`;
  }
  if (!model.qualities.includes(req.quality)) {
    return `${model.name} does not support ${req.quality} quality.`;
  }
  if (!model.resolutions.includes(req.resolution)) {
    return `${model.name} does not support ${req.resolution}. Supported: ${model.resolutions.join(", ")}.`;
  }
  if (req.count > model.maxCount) {
    return `${model.name} generates at most ${model.maxCount} image${model.maxCount === 1 ? "" : "s"} at a time.`;
  }
  if (req.refCount > model.maxRefs) {
    return model.maxRefs === 0
      ? `${model.name} does not take reference images.`
      : `${model.name} takes at most ${model.maxRefs} reference image${model.maxRefs === 1 ? "" : "s"}.`;
  }
  return null;
}

export async function handleSubmit(
  kind: GenerationKind,
  raw: unknown,
): Promise<SubmitResult> {
  const parsed = kind === "video" ? videoBody.safeParse(raw) : imageBody.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue.path.join(".");
    return invalid(where ? `${where}: ${issue.message}` : issue.message);
  }

  const request = { kind, ...parsed.data } as GenerationRequest;
  const problem =
    request.kind === "video" ? checkVideo(request) : checkImage(request);
  if (problem) return invalid(problem);

  const { jobId, etaMs } = await getProvider().submit(request);
  return { ok: true, jobId, etaMs };
}

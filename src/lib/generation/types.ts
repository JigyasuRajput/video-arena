import type { ImageQuality, ImageResolution, VideoResolution } from "@/lib/models";
import type { Aspect } from "@/lib/samples";

export type GenerationKind = "video" | "image";

/** Everything the form collected. Shared by the API, the store and the UI. */
export type VideoRequest = {
  kind: "video";
  model: string;
  prompt: string;
  duration: number;
  aspect: Aspect;
  resolution: VideoResolution;
  audio: boolean;
  hasStartFrame: boolean;
  hasEndFrame: boolean;
  refCount: number;
  seed?: number;
};

export type ImageRequest = {
  kind: "image";
  model: string;
  prompt: string;
  aspect: Aspect;
  quality: ImageQuality;
  resolution: ImageResolution;
  count: number;
  refCount: number;
  seed?: number;
};

export type GenerationRequest = VideoRequest | ImageRequest;

export type JobState = "queued" | "generating" | "completed" | "failed";

export type JobStatus = {
  status: JobState;
  /** 0-100. */
  progress: number;
  result?: { sampleIds: string[] };
  error?: string;
};

/**
 * The seam a real provider would drop into.
 *
 * Nothing about this interface is specific to the mock: `submit` hands back an
 * opaque job id and an ETA, `status` reports on it. Swapping in a real backend
 * (openrouter, fal, replicate) means writing one more implementation and
 * selecting it from GENERATION_MODE - no caller changes.
 */
export interface GenerationProvider {
  submit(req: GenerationRequest): Promise<{ jobId: string; etaMs: number }>;
  status(jobId: string): Promise<JobStatus>;
}

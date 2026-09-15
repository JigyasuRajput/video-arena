"use client";

import type { GenerationRequest, JobStatus } from "@/lib/generation/types";

/** Browser side of the two routes. Kept together so error handling is uniform. */

export type SubmitResponse = { jobId: string; etaMs: number };

export async function submitGeneration(
  request: GenerationRequest,
): Promise<SubmitResponse> {
  const { kind, ...body } = request;
  const response = await fetch(`/api/generate/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => null)) as
    | (SubmitResponse & { error?: string })
    | null;

  if (!response.ok || !data?.jobId) {
    throw new Error(data?.error ?? "Couldn't start the generation.");
  }
  return { jobId: data.jobId, etaMs: data.etaMs };
}

export async function fetchJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Couldn't reach the job.");
  return (await response.json()) as JobStatus;
}

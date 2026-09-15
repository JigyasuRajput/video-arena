import { handleSubmit } from "@/lib/generation/submit";

/** Thin wrapper - validation and provider dispatch are shared with the image route. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const result = await handleSubmit("video", body);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ jobId: result.jobId, etaMs: result.etaMs });
}

import type { NextRequest } from "next/server";

import { getProvider } from "@/lib/generation";

/**
 * One route for both kinds - the job id carries its own kind, so there is
 * nothing here to branch on.
 *
 * No store lookup: `status` decodes the id and works the state out from the
 * time that has passed, which is why this survives a cold function instance
 * and a page refresh alike.
 */
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/jobs/[jobId]">,
) {
  const { jobId } = await ctx.params;
  const status = await getProvider().status(jobId);

  return Response.json(status, {
    // It changes every second by design; never let a CDN hold onto it.
    headers: { "Cache-Control": "no-store" },
  });
}

import { joinWaitlistRequestSchema, waitlistEntrySchema, waitlistListSchema } from "@raahsathi/contracts/waitlist";
import { z } from "zod";

import { requireAuthenticatedSession } from "@/server/auth/authorization";
import { requireMutationSecurity } from "@/server/auth/csrf";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { parseJsonBody } from "@/server/http/json-body";
import { joinWaitlist, listWaitlistEntries } from "@/server/waitlist/waitlist-service";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const context = await requireAuthenticatedSession(request, correlationId);
    const raw = new URL(request.url).searchParams.get("applicationId");
    const parsed = raw === null ? undefined : z.uuid().safeParse(raw);
    if (parsed && !parsed.success) return Response.json({ error: { code: "VALIDATION_FAILED", messageKey: "errors.validationFailed", correlationId } }, { status: 400 });
    const response = Response.json(waitlistListSchema.parse({ entries: await listWaitlistEntries(context, { applicationId: parsed?.data, correlationId }) }));
    response.headers.set("cache-control", "no-store");
    return response;
  });
}

export async function POST(request: Request): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const session = await requireMutationSecurity(request, correlationId);
    const input = await parseJsonBody(request, joinWaitlistRequestSchema);
    const response = Response.json(waitlistEntrySchema.parse(await joinWaitlist(session.context, { ...input, correlationId })), { status: 201 });
    response.headers.set("cache-control", "no-store");
    return response;
  });
}

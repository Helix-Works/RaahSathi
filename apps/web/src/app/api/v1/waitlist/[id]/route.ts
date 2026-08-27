import { updateWaitlistRequestSchema, waitlistEntrySchema } from "@raahsathi/contracts/waitlist";
import { z } from "zod";

import { requireAuthenticatedSession } from "@/server/auth/authorization";
import { requireMutationSecurity } from "@/server/auth/csrf";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { apiErrors } from "@/server/http/api-error";
import { parseJsonBody } from "@/server/http/json-body";
import { getWaitlistEntry, leaveWaitlist, updateWaitlistEntry } from "@/server/waitlist/waitlist-service";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
async function entryId(context: Context): Promise<string> {
  const parsed = z.uuid().safeParse((await context.params).id);
  if (!parsed.success) throw apiErrors.notFound();
  return parsed.data;
}
export async function GET(request: Request, context: Context): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const auth = await requireAuthenticatedSession(request, correlationId);
    const response = Response.json(waitlistEntrySchema.parse(await getWaitlistEntry(auth, await entryId(context))));
    response.headers.set("cache-control", "no-store"); return response;
  });
}
export async function PATCH(request: Request, context: Context): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const auth = await requireMutationSecurity(request, correlationId);
    const input = await parseJsonBody(request, updateWaitlistRequestSchema);
    return Response.json(waitlistEntrySchema.parse(await updateWaitlistEntry(auth.context, await entryId(context), { ...input, correlationId })));
  });
}
export async function DELETE(request: Request, context: Context): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const auth = await requireMutationSecurity(request, correlationId);
    await leaveWaitlist(auth.context, await entryId(context), { correlationId });
    return new Response(null, { status: 204 });
  });
}

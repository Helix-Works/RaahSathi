import { joinWaitlistRequestSchema, waitlistEntrySchema, waitlistListSchema } from "@raahsathi/contracts/waitlist";
import { z } from "zod";

import type { AuthenticatedContext } from "@/server/auth/auth-types";
import { requireAuthenticatedSession } from "@/server/auth/authorization";
import { requireMutationSecurity } from "@/server/auth/csrf";
import { apiErrors } from "@/server/http/api-error";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { parseJsonBody } from "@/server/http/json-body";
import { joinWaitlist, listWaitlistEntries } from "@/server/waitlist/waitlist-service";

export const runtime = "nodejs";

type Authenticate = (request: Request, correlationId: string) => Promise<AuthenticatedContext>;
type ListWaitlist = typeof listWaitlistEntries;

export function createListWaitlistHandler(
  listEntries: ListWaitlist = listWaitlistEntries,
  authenticate: Authenticate = requireAuthenticatedSession,
) {
  return async function GET(request: Request): Promise<Response> {
    return handleApiRequest(request, async ({ correlationId }) => {
      const context = await authenticate(request, correlationId);
      const raw = new URL(request.url).searchParams.get("applicationId");
      const parsed = raw === null ? undefined : z.uuid().safeParse(raw);
      if (parsed && !parsed.success) throw apiErrors.validation({ applicationId: ["invalid_format"] });
      const response = Response.json(waitlistListSchema.parse({ entries: await listEntries(context, { applicationId: parsed?.data, correlationId }) }));
      response.headers.set("cache-control", "no-store");
      return response;
    });
  };
}

export const GET = createListWaitlistHandler();

export async function POST(request: Request): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const session = await requireMutationSecurity(request, correlationId);
    const input = await parseJsonBody(request, joinWaitlistRequestSchema);
    const response = Response.json(waitlistEntrySchema.parse(await joinWaitlist(session.context, { ...input, correlationId })), { status: 201 });
    response.headers.set("cache-control", "no-store");
    return response;
  });
}

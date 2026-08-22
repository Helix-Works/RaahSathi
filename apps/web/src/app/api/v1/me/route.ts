import { sessionSummarySchema } from "@raahsathi/contracts/auth";

import { resolveSessionFromCookie } from "@/server/auth/session-service";
import { apiErrors } from "@/server/http/api-error";
import { handleApiRequest } from "@/server/http/handle-api-request";

export const runtime = "nodejs";

type SessionResolver = typeof resolveSessionFromCookie;

export function createMeHandler(resolveSession: SessionResolver = resolveSessionFromCookie) {
  return async function meHandler(request: Request): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const session = await resolveSession(request.headers.get("cookie"), { correlationId });
    if (session.kind === "anonymous") throw apiErrors.unauthorized();
    if (session.kind === "expired") throw apiErrors.sessionExpired();
    const response = Response.json(sessionSummarySchema.parse({ user: session.user }));
    response.headers.set("cache-control", "no-store");
    return response;
  });
  };
}

export const GET = createMeHandler();

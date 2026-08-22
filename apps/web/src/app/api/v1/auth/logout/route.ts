import { NextResponse } from "next/server";

import { requireMutationSecurity } from "@/server/auth/csrf";
import { csrfCookieName, csrfCookieOptions, sessionCookieName, sessionCookieOptions } from "@/server/auth/cookies";
import { resolveSessionFromCookie, revokeSession } from "@/server/auth/session-service";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { assertSameOriginMutation } from "@/server/http/origin";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    assertSameOriginMutation(request);
    const existing = await resolveSessionFromCookie(request.headers.get("cookie"), { correlationId, touch: false });
    if (existing.kind === "authenticated") {
      const secured = await requireMutationSecurity(request, correlationId);
      await revokeSession(secured.context.sessionId, secured.context.applicantId, correlationId);
    }
    const response = new NextResponse(null, { status: 204 });
    const expired = new Date(0);
    const production = process.env.NODE_ENV === "production";
    response.cookies.set(sessionCookieName, "", sessionCookieOptions(expired, production));
    response.cookies.set(csrfCookieName, "", csrfCookieOptions(expired, production));
    response.headers.set("cache-control", "no-store");
    return response;
  });
}

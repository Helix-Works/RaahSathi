import { sessionSummarySchema, verifyOtpRequestSchema } from "@raahsathi/contracts/auth";
import { NextResponse } from "next/server";

import { verifyOtp } from "@/server/auth/auth-service";
import { csrfCookieName, csrfCookieOptions, sessionCookieName, sessionCookieOptions } from "@/server/auth/cookies";
import { sessionTokensFromRequest } from "@/server/auth/session-service";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { parseJsonBody } from "@/server/http/json-body";
import { assertSameOriginMutation } from "@/server/http/origin";

export const runtime = "nodejs";

type VerifyOtpService = typeof verifyOtp;

export function createVerifyOtpHandler(service: VerifyOtpService = verifyOtp) {
  return async function verifyOtpHandler(request: Request): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    assertSameOriginMutation(request);
    const input = await parseJsonBody(request, verifyOtpRequestSchema);
    const previousSessionToken = sessionTokensFromRequest(request).sessionToken;
    const result = await service(input, previousSessionToken, correlationId);
    const response = NextResponse.json(sessionSummarySchema.parse(result.summary));
    const production = process.env.NODE_ENV === "production";
    response.cookies.set(sessionCookieName, result.sessionToken, sessionCookieOptions(result.absoluteExpiresAt, production));
    response.cookies.set(csrfCookieName, result.csrfToken, csrfCookieOptions(result.absoluteExpiresAt, production));
    response.headers.set("cache-control", "no-store");
    return response;
  });
  };
}

export const POST = createVerifyOtpHandler();

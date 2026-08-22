import "server-only";

import { apiErrors } from "@/server/http/api-error";
import { assertSameOriginMutation } from "@/server/http/origin";
import { prisma } from "@/server/database/prisma";

import type { ResolvedSession } from "./auth-types";
import { writeAudit } from "./audit";
import { safeEqual, sha256 } from "./crypto";
import { resolveSessionFromCookie, sessionTokensFromRequest } from "./session-service";

export async function requireMutationSecurity(
  request: Request,
  correlationId: string,
): Promise<Extract<ResolvedSession, { kind: "authenticated" }>> {
  assertSameOriginMutation(request);
  const session = await resolveSessionFromCookie(request.headers.get("cookie"), { correlationId });
  if (session.kind === "anonymous") throw apiErrors.unauthorized();
  if (session.kind === "expired") throw apiErrors.sessionExpired();

  const { csrfToken } = sessionTokensFromRequest(request);
  const header = request.headers.get("x-csrf-token");
  if (!csrfToken || !header || !safeEqual(csrfToken, header) || !safeEqual(sha256(header), session.csrfSecretHash)) {
    await prisma.$transaction((database) => writeAudit(database, {
      actorApplicantId: session.context.applicantId,
      eventType: "CSRF_REJECTED",
      resourceType: "Session",
      resourceId: session.context.sessionId,
      correlationId,
      metadata: { reasonCode: "TOKEN_MISMATCH" },
    }));
    throw apiErrors.csrfInvalid();
  }
  return session;
}

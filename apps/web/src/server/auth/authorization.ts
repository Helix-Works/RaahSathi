import "server-only";

import { apiErrors } from "@/server/http/api-error";

import type { AuthenticatedContext } from "./auth-types";
import { resolveSessionFromCookie } from "./session-service";

export async function requireAuthenticatedSession(
  request: Request,
  correlationId: string,
): Promise<AuthenticatedContext> {
  const session = await resolveSessionFromCookie(request.headers.get("cookie"), { correlationId });
  if (session.kind === "anonymous") throw apiErrors.unauthorized();
  if (session.kind === "expired") throw apiErrors.sessionExpired();
  return session.context;
}

export function assertResourceOwner(ownerApplicantId: string, context: AuthenticatedContext): void {
  if (ownerApplicantId !== context.applicantId) throw apiErrors.forbidden();
}

export function ownerScopedWhere<T extends Record<string, unknown>>(
  context: AuthenticatedContext,
  where: T,
): T & { applicantId: string } {
  return { ...where, applicantId: context.applicantId };
}

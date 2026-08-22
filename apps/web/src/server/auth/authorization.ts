import "server-only";

import { apiErrors } from "@/server/http/api-error";

import type { AuthenticatedContext } from "./auth-types";

export function assertResourceOwner(ownerApplicantId: string, context: AuthenticatedContext): void {
  if (ownerApplicantId !== context.applicantId) throw apiErrors.forbidden();
}

export function ownerScopedWhere<T extends Record<string, unknown>>(
  context: AuthenticatedContext,
  where: T,
): T & { applicantId: string } {
  return { ...where, applicantId: context.applicantId };
}

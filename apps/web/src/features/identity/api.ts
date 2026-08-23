import { identityContextSchema, type IdentityContext } from "@raahsathi/contracts/identity";

import { apiRequest, createInvalidResponseError } from "@/lib/api";

function parseIdentityContext(payload: unknown): IdentityContext {
  const result = identityContextSchema.safeParse(payload);
  if (!result.success) throw createInvalidResponseError(200);
  return result.data;
}

export async function startIdentity(applicationId: string): Promise<IdentityContext> {
  return parseIdentityContext(await apiRequest(`/applications/${applicationId}/identity-attempts`, { method: "POST" }));
}

export async function retryIdentity(applicationId: string, attemptId: string): Promise<IdentityContext> {
  return parseIdentityContext(await apiRequest(`/applications/${applicationId}/identity-attempts/${attemptId}/retry`, { method: "POST" }));
}

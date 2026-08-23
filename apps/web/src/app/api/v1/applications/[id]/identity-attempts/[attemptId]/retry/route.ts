import { identityContextSchema } from "@raahsathi/contracts/identity";
import { z } from "zod";

import { requireMutationSecurity } from "@/server/auth/csrf";
import { apiErrors } from "@/server/http/api-error";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { retryIdentityAttempt } from "@/server/identity/identity-service";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string; attemptId: string }> }): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const params = await context.params;
    const id = z.uuid().safeParse(params.id);
    const attemptId = z.uuid().safeParse(params.attemptId);
    if (!id.success || !attemptId.success) {
      throw apiErrors.validation({
        ...(id.success ? {} : { id: ["invalid_format"] }),
        ...(attemptId.success ? {} : { attemptId: ["invalid_format"] }),
      });
    }
    const session = await requireMutationSecurity(request, correlationId);
    const response = Response.json(identityContextSchema.parse(await retryIdentityAttempt(session.context, {
      applicationId: id.data, attemptId: attemptId.data, correlationId,
    })));
    response.headers.set("cache-control", "no-store");
    return response;
  });
}

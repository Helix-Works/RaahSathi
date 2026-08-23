import { identityContextSchema } from "@raahsathi/contracts/identity";
import { z } from "zod";

import { requireMutationSecurity } from "@/server/auth/csrf";
import { apiErrors } from "@/server/http/api-error";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { startIdentityAttempt } from "@/server/identity/identity-service";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const id = z.uuid().safeParse((await context.params).id);
    if (!id.success) throw apiErrors.validation({ id: ["invalid_format"] });
    const session = await requireMutationSecurity(request, correlationId);
    const response = Response.json(identityContextSchema.parse(await startIdentityAttempt(session.context, {
      applicationId: id.data, correlationId,
    })));
    response.headers.set("cache-control", "no-store");
    return response;
  });
}

import { identityContextSchema } from "@raahsathi/contracts/identity";
import { z } from "zod";

import { requireAuthenticatedSession } from "@/server/auth/authorization";
import { apiErrors } from "@/server/http/api-error";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { getIdentityContext } from "@/server/identity/identity-service";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const id = z.uuid().safeParse((await context.params).id);
    if (!id.success) throw apiErrors.validation({ id: ["invalid_format"] });
    const authenticated = await requireAuthenticatedSession(request, correlationId);
    const response = Response.json(identityContextSchema.parse(await getIdentityContext(authenticated, id.data)));
    response.headers.set("cache-control", "no-store");
    return response;
  });
}

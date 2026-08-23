import { applicationDetailSchema } from "@raahsathi/contracts/applications";
import { z } from "zod";

import { requireAuthenticatedSession } from "@/server/auth/authorization";
import { getApplication } from "@/server/applications/application-service";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { apiErrors } from "@/server/http/api-error";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) throw apiErrors.validation({ id: ["invalid_format"] });
    const authenticated = await requireAuthenticatedSession(request, correlationId);
    const response = Response.json(applicationDetailSchema.parse(await getApplication(authenticated, id)));
    response.headers.set("cache-control", "no-store");
    return response;
  });
}

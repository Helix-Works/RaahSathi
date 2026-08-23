import { applicationDetailSchema, applicationSectionKeySchema, saveApplicationSectionRequestSchema } from "@raahsathi/contracts/applications";
import { z } from "zod";

import { requireMutationSecurity } from "@/server/auth/csrf";
import { saveApplicationSection } from "@/server/applications/application-service";
import { apiErrors } from "@/server/http/api-error";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { parseJsonBody } from "@/server/http/json-body";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string; sectionKey: string }> }): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const params = await context.params;
    const id = z.uuid().safeParse(params.id);
    const sectionKey = applicationSectionKeySchema.safeParse(params.sectionKey);
    if (!id.success || !sectionKey.success) throw apiErrors.validation();
    const session = await requireMutationSecurity(request, correlationId);
    const input = await parseJsonBody(request, saveApplicationSectionRequestSchema);
    const result = await saveApplicationSection(session.context, {
      applicationId: id.data, sectionKey: sectionKey.data, expectedRevision: input.expectedRevision,
      data: input.data, correlationId,
    });
    const response = Response.json(applicationDetailSchema.parse(result));
    response.headers.set("cache-control", "no-store");
    return response;
  });
}

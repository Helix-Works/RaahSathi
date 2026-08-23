import { applicationDetailSchema, applicationListSchema, createApplicationRequestSchema } from "@raahsathi/contracts/applications";

import { requireAuthenticatedSession } from "@/server/auth/authorization";
import { requireMutationSecurity } from "@/server/auth/csrf";
import { createApplication, listApplications } from "@/server/applications/application-service";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { parseJsonBody } from "@/server/http/json-body";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const context = await requireAuthenticatedSession(request, correlationId);
    const response = Response.json(applicationListSchema.parse({ applications: await listApplications(context) }));
    response.headers.set("cache-control", "no-store");
    return response;
  });
}

export async function POST(request: Request): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const session = await requireMutationSecurity(request, correlationId);
    const input = await parseJsonBody(request, createApplicationRequestSchema);
    const response = Response.json(applicationDetailSchema.parse(await createApplication(session.context, input.serviceKey, correlationId)), { status: 201 });
    response.headers.set("cache-control", "no-store");
    return response;
  });
}

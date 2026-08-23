import { licenceListSchema } from "@raahsathi/contracts/identity";

import { requireAuthenticatedSession } from "@/server/auth/authorization";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { listLicences } from "@/server/licences/licence-service";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const context = await requireAuthenticatedSession(request, correlationId);
    const response = Response.json(licenceListSchema.parse({ licences: await listLicences(context) }));
    response.headers.set("cache-control", "no-store");
    return response;
  });
}

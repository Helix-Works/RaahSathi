import { serviceListSchema } from "@raahsathi/contracts/applications";

import { listAvailableServices } from "@/server/applications/service-catalogue";
import { handleApiRequest } from "@/server/http/handle-api-request";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return handleApiRequest(request, () => {
    const response = Response.json(
      serviceListSchema.parse(listAvailableServices()),
    );
    response.headers.set("cache-control", "public, max-age=300");
    return response;
  });
}

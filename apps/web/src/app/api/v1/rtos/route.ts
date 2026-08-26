import { rtoListSchema } from "@raahsathi/contracts/appointments";

import { listRtos } from "@/server/appointments/appointment-service";
import { handleApiRequest } from "@/server/http/handle-api-request";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return handleApiRequest(request, async () => {
    const response = Response.json(rtoListSchema.parse(await listRtos()));
    response.headers.set("cache-control", "no-store");
    return response;
  });
}

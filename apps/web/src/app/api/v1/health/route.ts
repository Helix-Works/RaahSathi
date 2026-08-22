import { healthEndpointContract } from "@/server/contracts/health";
import { handleApiRequest } from "@/server/http/handle-api-request";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return handleApiRequest(request, () =>
    Response.json(healthEndpointContract.success.schema.parse({ status: "ok" })),
  );
}

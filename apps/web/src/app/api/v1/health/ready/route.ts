import { readinessEndpointContract } from "@/server/contracts/health";
import { checkDatabaseReadiness } from "@/server/database/prisma";
import { getReadiness, type ReadinessCheck } from "@/server/health/health-service";
import { handleApiRequest } from "@/server/http/handle-api-request";

export const runtime = "nodejs";

export function createReadinessHandler(check: ReadinessCheck) {
  return async function readinessHandler(request: Request): Promise<Response> {
    return handleApiRequest(request, async () =>
      Response.json(readinessEndpointContract.success.schema.parse(await getReadiness(check))),
    );
  };
}

export const GET = createReadinessHandler(checkDatabaseReadiness);

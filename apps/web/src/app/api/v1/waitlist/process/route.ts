import { processWaitlistRequestSchema } from "@raahsathi/contracts/waitlist";

import { requireMutationSecurity } from "@/server/auth/csrf";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { parseJsonBody } from "@/server/http/json-body";
import { processWaitlistState } from "@/server/waitlist/waitlist-service";

export const runtime = "nodejs";

type ProcessWaitlist = typeof processWaitlistState;
type RequireSecurity = typeof requireMutationSecurity;

export function createProcessWaitlistHandler(
  processState: ProcessWaitlist = processWaitlistState,
  requireSecurity: RequireSecurity = requireMutationSecurity,
) {
  return async function POST(request: Request): Promise<Response> {
    return handleApiRequest(request, async ({ correlationId }) => {
      const session = await requireSecurity(request, correlationId);
      const input = await parseJsonBody(request, processWaitlistRequestSchema);
      await processState(session.context, { ...input, correlationId });
      return new Response(null, { status: 204 });
    });
  };
}

export const POST = createProcessWaitlistHandler();

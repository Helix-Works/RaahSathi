import { waitlistEntrySchema } from "@raahsathi/contracts/waitlist";
import { z } from "zod";
import { requireMutationSecurity } from "@/server/auth/csrf";
import { apiErrors } from "@/server/http/api-error";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { declineOffer } from "@/server/waitlist/waitlist-service";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const auth = await requireMutationSecurity(request, correlationId);
    const id = z.uuid().safeParse((await context.params).id); if (!id.success) throw apiErrors.notFound();
    return Response.json(waitlistEntrySchema.parse(await declineOffer(auth.context, id.data, { correlationId })));
  });
}

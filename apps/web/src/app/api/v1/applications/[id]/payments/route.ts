import { createPaymentRequestSchema, paymentContextSchema } from "@raahsathi/contracts/payments";
import { z } from "zod";

import { requireMutationSecurity } from "@/server/auth/csrf";
import { apiErrors } from "@/server/http/api-error";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { parseJsonBody } from "@/server/http/json-body";
import { startPayment } from "@/server/payments/payment-service";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) throw apiErrors.validation({ id: ["invalid_format"] });
    const session = await requireMutationSecurity(request, correlationId);
    const input = await parseJsonBody(request, createPaymentRequestSchema);
    const response = Response.json(paymentContextSchema.parse(await startPayment(session.context, {
      applicationId: id,
      idempotencyKey: input.idempotencyKey,
      correlationId,
    })));
    response.headers.set("cache-control", "no-store");
    return response;
  });
}

import { paymentContextSchema } from "@raahsathi/contracts/payments";
import { z } from "zod";

import { requireAuthenticatedSession } from "@/server/auth/authorization";
import { apiErrors } from "@/server/http/api-error";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { getPayment } from "@/server/payments/payment-service";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) throw apiErrors.validation({ id: ["invalid_format"] });
    const authenticated = await requireAuthenticatedSession(request, correlationId);
    const response = Response.json(paymentContextSchema.parse(await getPayment(authenticated, id)));
    response.headers.set("cache-control", "no-store");
    return response;
  });
}

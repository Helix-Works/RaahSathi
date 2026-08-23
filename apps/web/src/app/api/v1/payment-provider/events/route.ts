import { paymentContextSchema, paymentProviderEventRequestSchema } from "@raahsathi/contracts/payments";

import { handleApiRequest } from "@/server/http/handle-api-request";
import { parseJsonBody } from "@/server/http/json-body";
import { processSignedPaymentProviderEvent } from "@/server/payments/payment-service";

export const runtime = "nodejs";

type ProviderEventService = typeof processSignedPaymentProviderEvent;

export function createPaymentProviderEventHandler(service: ProviderEventService = processSignedPaymentProviderEvent) {
  return async function paymentProviderEventHandler(request: Request): Promise<Response> {
    return handleApiRequest(request, async ({ correlationId }) => {
      const event = await parseJsonBody(request, paymentProviderEventRequestSchema);
      const context = await service(
        event,
        request.headers.get("x-raahsathi-provider-signature"),
        correlationId,
      );
      const response = Response.json(paymentContextSchema.parse(context));
      response.headers.set("cache-control", "no-store");
      return response;
    });
  };
}

export const POST = createPaymentProviderEventHandler();

import { paymentContextSchema, type PaymentContext } from "@raahsathi/contracts/payments";

import { apiRequest, createInvalidResponseError } from "@/lib/api";

function parsePaymentContext(payload: unknown): PaymentContext {
  const result = paymentContextSchema.safeParse(payload);
  if (!result.success) throw createInvalidResponseError(200);
  return result.data;
}

export async function startPayment(applicationId: string, idempotencyKey: string): Promise<PaymentContext> {
  return parsePaymentContext(await apiRequest(`/applications/${applicationId}/payments`, {
    method: "POST",
    json: { idempotencyKey },
  }));
}

export async function refreshPayment(paymentId: string): Promise<PaymentContext> {
  return parsePaymentContext(await apiRequest(`/payments/${paymentId}`));
}

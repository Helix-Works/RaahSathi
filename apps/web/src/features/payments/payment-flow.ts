import type { ApplicationDetail } from "@raahsathi/contracts/applications";
import type { PaymentContext } from "@raahsathi/contracts/payments";

export type PaymentInitiation = Readonly<{
  applicationId: string;
  idempotencyKey: string;
}>;

export type PaymentOperationLock = { current: boolean };

export function getOrCreatePaymentInitiation(
  current: PaymentInitiation | undefined,
  applicationId: string,
  createIdempotencyKey: () => string = () => crypto.randomUUID(),
): PaymentInitiation {
  if (current?.applicationId === applicationId) return current;

  return { applicationId, idempotencyKey: createIdempotencyKey() };
}

export function beginPaymentOperation(lock: PaymentOperationLock): boolean {
  if (lock.current) return false;
  lock.current = true;
  return true;
}

export function endPaymentOperation(lock: PaymentOperationLock): void {
  lock.current = false;
}

export function isPaymentRelevantApplicationStatus(
  status: ApplicationDetail["statusCode"],
): boolean {
  return status === "READY_FOR_PAYMENT" || status === "READY_FOR_APPOINTMENT" || status === "COMPLETED";
}

export async function synchronizePaymentResponse(
  context: PaymentContext,
  updatePaymentContext: (updated: PaymentContext) => void,
  refreshApplication: () => Promise<void>,
): Promise<void> {
  updatePaymentContext(context);
  await refreshApplication();
}

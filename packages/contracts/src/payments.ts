import { z } from "zod";

export const paymentStatusSchema = z.enum(["PENDING", "SUCCEEDED", "FAILED", "PROVIDER_UNAVAILABLE"]);
export const paymentProviderOutcomeSchema = z.enum(["SUCCESS", "FAILED"]);

export const createPaymentRequestSchema = z.object({
  idempotencyKey: z.uuid(),
}).strict();

export const feeBreakdownSchema = z.object({
  snapshotId: z.uuid().nullable(),
  baseFeeMinor: z.number().int().nonnegative(),
  serviceChargeMinor: z.number().int().nonnegative(),
  totalAmountMinor: z.number().int().positive(),
  currency: z.literal("INR"),
}).strict();

export const paymentAttemptSchema = z.object({
  id: z.uuid(),
  status: paymentStatusSchema,
  attemptNumber: z.number().int().positive(),
  providerReference: z.string().regex(/^SYN-PAY-[A-Z0-9-]{8,50}$/),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  succeededAt: z.iso.datetime().nullable(),
}).strict();

export const paymentContextSchema = z.object({
  applicationId: z.uuid(),
  fee: feeBreakdownSchema,
  attempt: paymentAttemptSchema.nullable(),
}).strict();

export const paymentProviderEventRequestSchema = z.object({
  eventId: z.string().regex(/^evt_[A-Za-z0-9_-]{8,80}$/),
  providerReference: z.string().regex(/^SYN-PAY-[A-Z0-9-]{8,50}$/),
  outcome: paymentProviderOutcomeSchema,
  amountMinor: z.number().int().positive(),
  occurredAt: z.iso.datetime(),
}).strict();

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type PaymentProviderOutcome = z.infer<typeof paymentProviderOutcomeSchema>;
export type PaymentProviderEventRequest = z.infer<typeof paymentProviderEventRequestSchema>;
export type PaymentContext = z.infer<typeof paymentContextSchema>;

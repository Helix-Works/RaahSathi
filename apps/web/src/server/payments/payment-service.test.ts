import { createPaymentRequestSchema } from "@raahsathi/contracts/payments";
import { Prisma, type PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { isRetryableTransactionConflict } from "@/server/database/prisma-errors";
import { ApiError } from "@/server/http/api-error";

import {
  applyPaymentProviderEvent,
  feeForService,
  getPayment,
  getPaymentContextForApplication,
  paymentDecisionForScenario,
  paymentTransition,
  providerEventCanonicalValue,
  signPaymentProviderEvent,
  verifyPaymentProviderSignature,
} from "./payment-service";

const event = {
  eventId: "evt_phase4_success_0001",
  providerReference: "SYN-PAY-30000000-0000-4000-8000-000000000001",
  outcome: "SUCCESS" as const,
  amountMinor: 55_000,
  occurredAt: "2026-08-23T12:00:00.000Z",
};

describe("payment convergence foundation", () => {
  it("classifies only established Prisma transaction serialization conflicts as retryable", () => {
    const prismaError = (code: string, meta?: Record<string, unknown>) => new Prisma.PrismaClientKnownRequestError("database failure", {
      code,
      clientVersion: Prisma.prismaVersion.client,
      meta,
    });

    expect(isRetryableTransactionConflict(prismaError("P2034"))).toBe(true);
    expect(isRetryableTransactionConflict(prismaError("P2010", {
      code: "40001",
      message: "could not serialize access due to concurrent update",
    }))).toBe(true);
    expect(isRetryableTransactionConflict(prismaError("P2010", {
      code: "23505",
      message: "duplicate key value violates unique constraint",
    }))).toBe(false);
    expect(isRetryableTransactionConflict(prismaError("P2010", { code: "N/A" }))).toBe(false);
    expect(isRetryableTransactionConflict(prismaError("P2024"))).toBe(false);
    expect(isRetryableTransactionConflict(new Error("database failure"))).toBe(false);
  });

  it("retries a raw PostgreSQL serialization conflict once and lets a repeated conflict escape", async () => {
    const serializationConflict = new Prisma.PrismaClientKnownRequestError("Raw query failed", {
      code: "P2010",
      clientVersion: Prisma.prismaVersion.client,
      meta: {
        code: "40001",
        message: "could not serialize access due to concurrent update",
      },
    });
    let transactionAttempts = 0;
    const database = {
      $transaction: async () => {
        transactionAttempts += 1;
        throw serializationConflict;
      },
    } as unknown as PrismaClient;

    await expect(applyPaymentProviderEvent(
      event,
      "phase4-serialization-retry",
      database,
    )).rejects.toBe(serializationConflict);
    expect(transactionAttempts).toBe(2);
  });

  it("does not retry or swallow an unrelated raw-query failure", async () => {
    const syntaxError = new Prisma.PrismaClientKnownRequestError("Raw query failed", {
      code: "P2010",
      clientVersion: Prisma.prismaVersion.client,
      meta: {
        code: "42601",
        message: "syntax error",
      },
    });
    let transactionAttempts = 0;
    const database = {
      $transaction: async () => {
        transactionAttempts += 1;
        throw syntaxError;
      },
    } as unknown as PrismaClient;

    await expect(applyPaymentProviderEvent(
      event,
      "phase4-non-retryable-error",
      database,
    )).rejects.toBe(syntaxError);
    expect(transactionAttempts).toBe(1);
  });

  it("calculates immutable INR fees from the service rather than client input", () => {
    expect(feeForService("LEARNER_LICENCE")).toEqual({
      baseFeeMinor: 50_000,
      serviceChargeMinor: 5_000,
      totalAmountMinor: 55_000,
      currency: "INR",
    });
    expect(feeForService("PERMANENT_DRIVING_LICENCE").totalAmountMinor).toBe(75_000);
    expect(() => createPaymentRequestSchema.parse({ idempotencyKey: crypto.randomUUID(), amountMinor: 1 })).toThrow();
  });

  it("uses one stable canonical value and rejects spoofed provider signatures", () => {
    const secret = "phase-4-test-provider-secret-at-least-32-characters";
    const signature = signPaymentProviderEvent(event, secret);
    expect(providerEventCanonicalValue(event)).toBe("evt_phase4_success_0001|SYN-PAY-30000000-0000-4000-8000-000000000001|SUCCESS|55000|2026-08-23T12:00:00.000Z");
    expect(() => verifyPaymentProviderSignature(event, signature, secret)).not.toThrow();
    expect(() => verifyPaymentProviderSignature(event, "sha256=spoofed", secret)).toThrow(ApiError);
  });

  it("models every deterministic provider scenario and recovers on a new attempt", () => {
    expect(paymentDecisionForScenario("SUCCESS", 1)).toMatchObject({ initialStatus: "PENDING", immediateOutcome: "SUCCESS" });
    expect(paymentDecisionForScenario("DELAYED_SUCCESS", 1)).toEqual({ scenario: "DELAYED_SUCCESS", initialStatus: "PENDING" });
    expect(paymentDecisionForScenario("DUPLICATE_CALLBACK", 1)).toMatchObject({ immediateOutcome: "SUCCESS" });
    expect(paymentDecisionForScenario("FAILED", 1)).toMatchObject({ immediateOutcome: "FAILED" });
    expect(paymentDecisionForScenario("PROVIDER_UNAVAILABLE", 1)).toEqual({ scenario: "PROVIDER_UNAVAILABLE", initialStatus: "PROVIDER_UNAVAILABLE" });
    expect(paymentDecisionForScenario("PROVIDER_UNAVAILABLE", 2)).toMatchObject({ scenario: "SUCCESS", immediateOutcome: "SUCCESS" });
  });

  it("converges duplicate and reordered outcomes without double advancement", () => {
    expect(paymentTransition("PENDING", "FAILED")).toEqual({ nextStatus: "FAILED", appendFailure: true, advanceApplication: false });
    expect(paymentTransition("FAILED", "SUCCESS")).toEqual({ nextStatus: "SUCCEEDED", appendFailure: false, advanceApplication: true });
    expect(paymentTransition("SUCCEEDED", "SUCCESS")).toEqual({ nextStatus: "SUCCEEDED", appendFailure: false, advanceApplication: false });
    expect(paymentTransition("SUCCEEDED", "FAILED")).toEqual({ nextStatus: "SUCCEEDED", appendFailure: false, advanceApplication: false });
  });

  it("returns the payment attempt identified by the requested resource ID", async () => {
    const applicationId = "30000000-0000-4000-8000-000000000001";
    const requestedPaymentId = "30000000-0000-4000-8000-000000000002";
    const newestPaymentId = "30000000-0000-4000-8000-000000000003";
    const createdAt = new Date("2026-08-23T12:00:00.000Z");
    const database = {
      paymentAttempt: {
        findFirst: async () => ({ applicationId }),
      },
      application: {
        findFirst: async () => ({
          id: applicationId,
          serviceKey: "LEARNER_LICENCE",
          feeSnapshot: null,
          paymentAttempts: [
            {
              id: newestPaymentId,
              status: "FAILED",
              attemptNumber: 2,
              providerReference: "SYN-PAY-NEWEST-ATTEMPT",
              createdAt,
              updatedAt: createdAt,
              succeededAt: null,
            },
            {
              id: requestedPaymentId,
              status: "SUCCEEDED",
              attemptNumber: 1,
              providerReference: "SYN-PAY-REQUESTED-ATTEMPT",
              createdAt,
              updatedAt: createdAt,
              succeededAt: createdAt,
            },
          ],
        }),
      },
    } as unknown as PrismaClient;

    const context = { sessionId: crypto.randomUUID(), applicantId: crypto.randomUUID() };
    const applicationPayment = await getPaymentContextForApplication(
      context,
      applicationId,
      database,
    );
    const payment = await getPayment(
      context,
      requestedPaymentId,
      database,
    );

    expect(applicationPayment.attempt).toMatchObject({
      id: requestedPaymentId,
      status: "SUCCEEDED",
      providerReference: "SYN-PAY-REQUESTED-ATTEMPT",
    });
    expect(payment.attempt).toMatchObject({
      id: requestedPaymentId,
      status: "SUCCEEDED",
      providerReference: "SYN-PAY-REQUESTED-ATTEMPT",
    });
  });

  it("returns the newest attempt when no payment has succeeded", async () => {
    const applicationId = "30000000-0000-4000-8000-000000000001";
    const newestPaymentId = "30000000-0000-4000-8000-000000000003";
    const olderPaymentId = "30000000-0000-4000-8000-000000000002";
    const createdAt = new Date("2026-08-23T12:00:00.000Z");
    const database = {
      application: {
        findFirst: async () => ({
          id: applicationId,
          serviceKey: "LEARNER_LICENCE",
          feeSnapshot: null,
          paymentAttempts: [
            {
              id: newestPaymentId,
              status: "PENDING",
              attemptNumber: 2,
              providerReference: "SYN-PAY-NEWEST-ATTEMPT",
              createdAt,
              updatedAt: createdAt,
              succeededAt: null,
            },
            {
              id: olderPaymentId,
              status: "FAILED",
              attemptNumber: 1,
              providerReference: "SYN-PAY-OLDER-ATTEMPT",
              createdAt,
              updatedAt: createdAt,
              succeededAt: null,
            },
          ],
        }),
      },
    } as unknown as PrismaClient;

    const payment = await getPaymentContextForApplication(
      { sessionId: crypto.randomUUID(), applicantId: crypto.randomUUID() },
      applicationId,
      database,
    );

    expect(payment.attempt).toMatchObject({
      id: newestPaymentId,
      status: "PENDING",
      providerReference: "SYN-PAY-NEWEST-ATTEMPT",
    });
  });
});

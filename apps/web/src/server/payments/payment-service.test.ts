import { createPaymentRequestSchema } from "@raahsathi/contracts/payments";
import { describe, expect, it } from "vitest";

import { ApiError } from "@/server/http/api-error";

import {
  feeForService,
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
});

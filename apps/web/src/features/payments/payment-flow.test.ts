import { describe, expect, it, vi } from "vitest";

import {
  beginPaymentOperation,
  endPaymentOperation,
  getOrCreatePaymentInitiation,
  isPaymentRelevantApplicationStatus,
  synchronizePaymentResponse,
} from "./payment-flow";

describe("payment initiation lifecycle", () => {
  it("keeps one UUID for retries of the same ambiguous logical initiation", () => {
    const createKey = vi.fn(() => "40000000-0000-4000-8000-000000000001");
    const first = getOrCreatePaymentInitiation(undefined, "30000000-0000-4000-8000-000000000001", createKey);
    const retried = getOrCreatePaymentInitiation(first, first.applicationId, createKey);

    expect(retried).toBe(first);
    expect(createKey).toHaveBeenCalledOnce();
  });

  it("creates a new key after a resolved action or for another application", () => {
    const createKey = vi.fn()
      .mockReturnValueOnce("40000000-0000-4000-8000-000000000001")
      .mockReturnValueOnce("40000000-0000-4000-8000-000000000002")
      .mockReturnValueOnce("40000000-0000-4000-8000-000000000003");
    const first = getOrCreatePaymentInitiation(undefined, "30000000-0000-4000-8000-000000000001", createKey);
    const afterResolved = getOrCreatePaymentInitiation(undefined, first.applicationId, createKey);
    const anotherApplication = getOrCreatePaymentInitiation(first, "30000000-0000-4000-8000-000000000002", createKey);

    expect(afterResolved.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(anotherApplication.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(createKey).toHaveBeenCalledTimes(3);
  });

  it("rejects a second operation while the first request is in flight", () => {
    const lock = { current: false };

    expect(beginPaymentOperation(lock)).toBe(true);
    expect(beginPaymentOperation(lock)).toBe(false);
    endPaymentOperation(lock);
    expect(beginPaymentOperation(lock)).toBe(true);
  });

  it("shows payment only at the backend-approved payment and appointment handoff states", () => {
    expect(isPaymentRelevantApplicationStatus("DRAFT")).toBe(false);
    expect(isPaymentRelevantApplicationStatus("IN_PROGRESS")).toBe(false);
    expect(isPaymentRelevantApplicationStatus("READY_FOR_IDENTITY")).toBe(false);
    expect(isPaymentRelevantApplicationStatus("READY_FOR_PAYMENT")).toBe(true);
    expect(isPaymentRelevantApplicationStatus("READY_FOR_APPOINTMENT")).toBe(true);
  });

  it("refetches application authority as pending payment converges to success", async () => {
    const base = {
      applicationId: "30000000-0000-4000-8000-000000000001",
      fee: {
        snapshotId: "40000000-0000-4000-8000-000000000001",
        baseFeeMinor: 50_000,
        serviceChargeMinor: 5_000,
        totalAmountMinor: 55_000,
        currency: "INR" as const,
      },
    };
    const attempt = {
      id: "50000000-0000-4000-8000-000000000001",
      attemptNumber: 1,
      providerReference: "SYN-PAY-50000000-0000-4000-8000-000000000001",
      createdAt: "2026-08-24T12:00:00.000Z",
      updatedAt: "2026-08-24T12:00:00.000Z",
      succeededAt: null,
    };
    const observedStatuses: string[] = [];
    const refreshApplication = vi.fn(async () => undefined);

    await synchronizePaymentResponse(
      { ...base, attempt: { ...attempt, status: "PENDING" } },
      (updated) => observedStatuses.push(updated.attempt?.status ?? "NONE"),
      refreshApplication,
    );
    await synchronizePaymentResponse(
      {
        ...base,
        attempt: {
          ...attempt,
          status: "SUCCEEDED",
          updatedAt: "2026-08-24T12:01:00.000Z",
          succeededAt: "2026-08-24T12:01:00.000Z",
        },
      },
      (updated) => observedStatuses.push(updated.attempt?.status ?? "NONE"),
      refreshApplication,
    );

    expect(observedStatuses).toEqual(["PENDING", "SUCCEEDED"]);
    expect(refreshApplication).toHaveBeenCalledTimes(2);
  });
});

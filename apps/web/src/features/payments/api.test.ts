import { afterEach, describe, expect, it, vi } from "vitest";

import { refreshPayment, startPayment } from "./api";

const paymentContext = {
  applicationId: "30000000-0000-4000-8000-000000000001",
  fee: {
    snapshotId: "40000000-0000-4000-8000-000000000001",
    baseFeeMinor: 50_000,
    serviceChargeMinor: 5_000,
    totalAmountMinor: 55_000,
    currency: "INR" as const,
  },
  attempt: {
    id: "50000000-0000-4000-8000-000000000001",
    status: "PENDING" as const,
    attemptNumber: 1,
    providerReference: "SYN-PAY-50000000-0000-4000-8000-000000000001",
    createdAt: "2026-08-24T12:00:00.000Z",
    updatedAt: "2026-08-24T12:00:00.000Z",
    succeededAt: null,
  },
};

describe("payment frontend API", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends the caller-owned stable UUID without calculating payment data", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return Response.json(paymentContext);
    });
    vi.stubGlobal("fetch", fetchMock);
    const key = "60000000-0000-4000-8000-000000000001";

    await startPayment(paymentContext.applicationId, key);
    await startPayment(paymentContext.applicationId, key);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({ idempotencyKey: key });
    }
  });

  it("uses the explicit payment resource for manual refresh", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return Response.json(paymentContext);
    });
    vi.stubGlobal("fetch", fetchMock);

    await refreshPayment(paymentContext.attempt.id);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/v1/payments/${paymentContext.attempt.id}`,
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("rejects malformed successful responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ applicationId: paymentContext.applicationId })));

    await expect(refreshPayment(paymentContext.attempt.id)).rejects.toMatchObject({
      code: "INVALID_API_RESPONSE",
    });
  });
});

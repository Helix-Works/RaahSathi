import { paymentContextSchema, paymentAttemptSchema } from "@raahsathi/contracts/payments";
import { describe, expect, it } from "vitest";

import { phase6DemoApplications, phase6DemoPaymentFixture } from "./phase6-demo-seed";

describe("Phase 6 demo payment fixtures", () => {
  it("uses the established deterministic SYN-PAY UUID convention for every account", () => {
    for (let index = 0; index < phase6DemoApplications.length; index += 1) {
      const fixture = phase6DemoPaymentFixture(index);
      expect(fixture.providerReference).toMatch(/^SYN-PAY-[A-Z0-9-]{8,50}$/);
      expect(() => paymentContextSchema.parse({
        applicationId: fixture.application.id,
        fee: {
          snapshotId: fixture.feeSnapshotId,
          baseFeeMinor: 50_000,
          serviceChargeMinor: 5_000,
          totalAmountMinor: 55_000,
          currency: "INR",
        },
        attempt: {
          id: fixture.paymentAttemptId,
          status: "SUCCEEDED",
          attemptNumber: 1,
          providerReference: fixture.providerReference,
          createdAt: "2026-08-26T10:00:00.000Z",
          updatedAt: "2026-08-26T10:00:00.000Z",
          succeededAt: "2026-08-26T10:00:00.000Z",
        },
      })).not.toThrow();
    }
  });

  it("keeps the payment contract strict against the legacy malformed seed format", () => {
    const fixture = phase6DemoPaymentFixture(1);
    expect(() => paymentAttemptSchema.parse({
      id: fixture.paymentAttemptId,
      status: "SUCCEEDED",
      attemptNumber: 1,
      providerReference: fixture.legacyProviderReference,
      createdAt: "2026-08-26T10:00:00.000Z",
      updatedAt: "2026-08-26T10:00:00.000Z",
      succeededAt: "2026-08-26T10:00:00.000Z",
    })).toThrow();
  });
});

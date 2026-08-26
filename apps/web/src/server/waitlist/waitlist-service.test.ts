import { describe, expect, it } from "vitest";

import { joinWaitlistRequestSchema, updateWaitlistRequestSchema } from "@raahsathi/contracts/waitlist";

import { slotTimeBucket } from "./waitlist-service";

describe("waitlist compatibility primitives", () => {
  it("maps Delhi appointment times into stable buckets", () => {
    expect(slotTimeBucket("09:00")).toBe("MORNING");
    expect(slotTimeBucket("11:59")).toBe("MORNING");
    expect(slotTimeBucket("12:00")).toBe("AFTERNOON");
  });

  it("rejects reversed date ranges and unknown preference fields", () => {
    expect(joinWaitlistRequestSchema.safeParse({
      applicationId: crypto.randomUUID(), rtoId: crypto.randomUUID(),
      acceptableDateFrom: "2026-09-02", acceptableDateTo: "2026-09-01",
      timeBuckets: ["MORNING"], vehicleClass: "LMV",
    }).success).toBe(false);
    expect(joinWaitlistRequestSchema.safeParse({
      applicationId: crypto.randomUUID(), rtoId: crypto.randomUUID(),
      acceptableDateFrom: "2026-09-01", acceptableDateTo: "2026-09-02",
      timeBuckets: ["MORNING"], vehicleClass: "LMV", joinedAt: "tampered",
    }).success).toBe(false);
    expect(updateWaitlistRequestSchema.safeParse({
      rtoId: crypto.randomUUID(), acceptableDateFrom: "2026-09-02", acceptableDateTo: "2026-09-01",
      timeBuckets: ["AFTERNOON"], vehicleClass: "LMV",
    }).success).toBe(false);
    expect(updateWaitlistRequestSchema.safeParse({
      rtoId: crypto.randomUUID(), acceptableDateFrom: "2026-09-01", acceptableDateTo: "2026-09-02",
      timeBuckets: [], vehicleClass: "LMV",
    }).success).toBe(false);
  });
});

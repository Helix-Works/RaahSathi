import { Prisma, type PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  joinWaitlistRequestSchema,
  processWaitlistRequestSchema,
  updateWaitlistRequestSchema,
} from "@raahsathi/contracts/waitlist";

import { acceptOffer, declineOffer, slotTimeBucket } from "./waitlist-service";

const applicantId = "10000000-0000-4000-8000-000000000001";
const applicationId = "20000000-0000-4000-8000-000000000001";
const entryId = "30000000-0000-4000-8000-000000000001";
const rtoId = "40000000-0000-4000-8000-000000000001";
const slotId = "50000000-0000-4000-8000-000000000001";
const appointmentId = "60000000-0000-4000-8000-000000000001";
const now = new Date("2026-08-26T12:00:00.000Z");

function prismaError(code: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError("Synthetic transaction conflict", {
    code,
    clientVersion: "6.19.3",
    meta,
  });
}

const rto = {
  id: rtoId,
  code: "SYNTHETIC_TEST",
  nameEn: "Synthetic RTO",
  nameHi: "कृत्रिम आरटीओ",
  district: "Synthetic Delhi",
  operationalStatus: "AVAILABLE",
  bookingServiceStatus: "AVAILABLE",
  createdAt: now,
  updatedAt: now,
} as const;

const entryRecord = {
  id: entryId,
  applicationId,
  applicantId,
  rtoId,
  serviceKey: "LEARNER_LICENCE",
  vehicleClass: "LMV",
  acceptableDateFrom: new Date("2026-09-10T00:00:00.000Z"),
  acceptableDateTo: new Date("2026-09-10T00:00:00.000Z"),
  timeBuckets: ["MORNING"],
  status: "ACTIVE",
  joinedAt: now,
  createdAt: now,
  updatedAt: now,
  rto,
  offers: [],
} as const;

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
    expect(processWaitlistRequestSchema.safeParse({
      applicationId: crypto.randomUUID(), unexpected: true,
    }).success).toBe(false);
  });

  it("retries the complete accept transaction once for P2034", async () => {
    const transaction = vi.fn()
      .mockRejectedValueOnce(prismaError("P2034"))
      .mockResolvedValueOnce({
        kind: "appointment",
        appointment: {
          id: appointmentId,
          applicationId,
          applicantId,
          slotId,
          status: "CONFIRMED",
          bookedAt: now,
          cancelledAt: null,
          createdAt: now,
          updatedAt: now,
          application: {
            id: applicationId,
            applicantId,
            serviceKey: "LEARNER_LICENCE",
            status: "APPOINTMENT_BOOKED",
            identityScenario: "SUCCESS",
            paymentScenario: "SUCCESS",
            createdAt: now,
            updatedAt: now,
          },
          slot: {
            id: slotId,
            rtoId,
            serviceKey: "LEARNER_LICENCE",
            date: new Date("2026-09-10T00:00:00.000Z"),
            startTime: "09:00",
            endTime: "09:30",
            capacity: 1,
            bookedCount: 1,
            heldCount: 0,
            vehicleClass: "LMV",
            releasedAt: now,
            createdAt: now,
            updatedAt: now,
            rto,
          },
        },
      });
    const database = {
      waitlistRateLimitBucket: { upsert: vi.fn().mockResolvedValue({ count: 1 }) },
      $transaction: transaction,
    } as unknown as PrismaClient;

    await expect(acceptOffer(
      { sessionId: crypto.randomUUID(), applicantId },
      crypto.randomUUID(),
      { correlationId: "accept-retry", now },
      database,
    )).resolves.toMatchObject({ id: appointmentId, status: "CONFIRMED" });
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(transaction).toHaveBeenLastCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
      maxWait: 5_000,
      timeout: 20_000,
    });
  });

  it("retries the complete decline transaction once for raw SQLSTATE 40001", async () => {
    const transaction = vi.fn()
      .mockRejectedValueOnce(prismaError("P2010", { code: "40001" }))
      .mockResolvedValueOnce({ entryId, releasedSlots: [] });
    const database = {
      waitlistRateLimitBucket: { upsert: vi.fn().mockResolvedValue({ count: 1 }) },
      waitlistEntry: { findFirst: vi.fn().mockResolvedValue(entryRecord) },
      $transaction: transaction,
    } as unknown as PrismaClient;

    await expect(declineOffer(
      { sessionId: crypto.randomUUID(), applicantId },
      crypto.randomUUID(),
      { correlationId: "decline-retry", now },
      database,
    )).resolves.toMatchObject({ id: entryId, status: "ACTIVE" });
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(transaction).toHaveBeenLastCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
      maxWait: 5_000,
      timeout: 20_000,
    });
  });
});

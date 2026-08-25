import { createAppointmentRequestSchema } from "@raahsathi/contracts/appointments";
import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { ApiError, apiErrors } from "@/server/http/api-error";

import {
  dependencyAvailabilityStatus,
  getDaySlots,
  getMonthAvailability,
  slotAvailabilityStatus,
} from "./appointment-service";

describe("Phase 5 appointment availability", () => {
  const now = new Date("2026-08-25T12:00:00.000Z");

  it("keeps every availability reason semantically distinct", () => {
    expect(dependencyAvailabilityStatus({ operationalStatus: "CENTER_UNAVAILABLE", bookingServiceStatus: "AVAILABLE" }))
      .toBe("CENTER_UNAVAILABLE");
    expect(dependencyAvailabilityStatus({ operationalStatus: "AVAILABLE", bookingServiceStatus: "BOOKING_SERVICE_UNAVAILABLE" }))
      .toBe("BOOKING_SERVICE_UNAVAILABLE");
    expect(slotAvailabilityStatus({ capacity: 2, bookedCount: 0, releasedAt: null }, {
      operationalStatus: "AVAILABLE", bookingServiceStatus: "AVAILABLE",
    }, now)).toBe("SLOTS_NOT_RELEASED");
    expect(slotAvailabilityStatus({ capacity: 2, bookedCount: 2, releasedAt: new Date("2026-08-24T00:00:00.000Z") }, {
      operationalStatus: "AVAILABLE", bookingServiceStatus: "AVAILABLE",
    }, now)).toBe("CAPACITY_FULL");
    expect(slotAvailabilityStatus({ capacity: 2, bookedCount: 1, releasedAt: new Date("2026-08-24T00:00:00.000Z") }, {
      operationalStatus: "AVAILABLE", bookingServiceStatus: "AVAILABLE",
    }, now)).toBe("AVAILABLE");
  });

  it("rejects client authority fields from the booking contract", () => {
    const request = { applicationId: crypto.randomUUID(), slotId: crypto.randomUUID() };
    expect(createAppointmentRequestSchema.parse(request)).toEqual(request);
    expect(() => createAppointmentRequestSchema.parse({
      ...request,
      capacity: 999,
      remaining: 999,
      status: "AVAILABLE",
    })).toThrow();
  });

  it("returns stable conflict codes for each unavailable dependency", async () => {
    for (const reason of [
      "CAPACITY_FULL",
      "SLOTS_NOT_RELEASED",
      "CENTER_UNAVAILABLE",
      "BOOKING_SERVICE_UNAVAILABLE",
    ] as const) {
      const error = apiErrors.appointmentUnavailable(reason);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ status: 409, code: reason, messageKey: `appointments.reasons.${reason}` });
    }
  });

  it("derives month and day projections from persisted release and capacity state", async () => {
    const rtoId = crypto.randomUUID();
    const createdAt = new Date("2026-08-20T00:00:00.000Z");
    const updatedAt = createdAt;
    const rto = {
      id: rtoId,
      code: "SYNTHETIC_TEST_RTO",
      nameEn: "Synthetic Test RTO",
      nameHi: "कृत्रिम परीक्षण आरटीओ",
      district: "Test Delhi",
      operationalStatus: "AVAILABLE" as const,
      bookingServiceStatus: "AVAILABLE" as const,
      createdAt,
      updatedAt: createdAt,
    };
    const slots = [
      {
        id: crypto.randomUUID(), rtoId, serviceKey: "LEARNER_LICENCE" as const,
        date: new Date("2026-08-26T00:00:00.000Z"), startTime: "09:00", endTime: "09:30",
        capacity: 2, bookedCount: 1, releasedAt: new Date("2026-08-24T00:00:00.000Z"),
        createdAt, updatedAt, rto,
      },
      {
        id: crypto.randomUUID(), rtoId, serviceKey: "LEARNER_LICENCE" as const,
        date: new Date("2026-08-27T00:00:00.000Z"), startTime: "10:00", endTime: "10:30",
        capacity: 2, bookedCount: 0, releasedAt: null,
        createdAt, updatedAt, rto,
      },
    ];
    const database = {
      rto: { findUnique: async () => rto },
      appointmentSlot: {
        findMany: async (query: Readonly<{ where: { date: Date | { gte: Date } } }>) => {
          const queryDate = query.where.date;
          return queryDate instanceof Date
            ? slots.filter((slot) => slot.date.getTime() === queryDate.getTime())
            : slots;
        },
      },
    } as unknown as PrismaClient;

    const month = await getMonthAvailability({
      rtoId, month: "2026-08", serviceKey: "LEARNER_LICENCE", now,
    }, database);
    expect(month.days).toHaveLength(31);
    expect(month.days.find((day) => day.date === "2026-08-26")).toEqual({
      date: "2026-08-26", status: "AVAILABLE", availableSlots: 1,
    });
    expect(month.days.find((day) => day.date === "2026-08-27")?.status).toBe("SLOTS_NOT_RELEASED");

    const day = await getDaySlots({
      rtoId, date: "2026-08-26", serviceKey: "LEARNER_LICENCE", now,
    }, database);
    expect(day).toMatchObject({ status: "AVAILABLE", slots: [{ remaining: 1, status: "AVAILABLE" }] });
  });
});

import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { isDisposableDatabaseApproved } from "@/server/auth/database-test-safety";

import { seedSyntheticAppointments } from "../../../prisma/seed-appointments";
import { bookAppointment, cancelAppointment, getDaySlots, listAppointments } from "./appointment-service";

const testUrl = process.env.TEST_DATABASE_URL;
const approved = isDisposableDatabaseApproved({
  testDatabaseUrl: testUrl,
  primaryDatabaseUrl: process.env.DATABASE_URL,
  confirmation: process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION,
});
if ((testUrl || process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION) && !approved) {
  throw new Error("Refusing Phase 5 database tests: database identities are not safely distinct.");
}
const database = approved ? new PrismaClient({ datasourceUrl: testUrl }) : undefined;

describe.skipIf(!database)("Phase 5 disposable PostgreSQL appointment capacity", () => {
  const applicantA = randomUUID();
  const applicantB = randomUUID();
  const applicationA = randomUUID();
  const applicationB = randomUUID();
  const seededApplicant = randomUUID();
  const seededApplication = randomUUID();
  const rtoId = randomUUID();
  const slotId = randomUUID();
  const seededSlotId = "51000000-0000-4000-8000-000000000001";
  const contextA = { sessionId: randomUUID(), applicantId: applicantA };
  const contextB = { sessionId: randomUUID(), applicantId: applicantB };
  const now = new Date("2026-08-25T12:00:00.000Z");

  beforeAll(async () => {
    if (!database) return;
    const staleApplicants = await database.applicant.findMany({
      where: { mobileLookupHash: { startsWith: "phase5-seed-" } },
      select: { id: true },
    });
    const staleApplicantIds = staleApplicants.map(({ id }) => id);
    if (staleApplicantIds.length === 0) return;
    const staleApplications = await database.application.findMany({
      where: { applicantId: { in: staleApplicantIds } },
      select: { id: true },
    });
    const staleApplicationIds = staleApplications.map(({ id }) => id);
    await database.appointment.deleteMany({ where: { applicationId: { in: staleApplicationIds } } });
    await database.paymentAttempt.deleteMany({ where: { applicationId: { in: staleApplicationIds } } });
    await database.feeSnapshot.deleteMany({ where: { applicationId: { in: staleApplicationIds } } });
    await database.application.deleteMany({ where: { id: { in: staleApplicationIds } } });
    await database.applicant.deleteMany({ where: { id: { in: staleApplicantIds } } });
  });

  afterAll(async () => {
    if (!database) return;
    try {
      await database.auditEvent.deleteMany({ where: { resourceType: "Appointment", actorApplicantId: { in: [applicantA, applicantB] } } });
      await database.appointmentRateLimitBucket.deleteMany({ where: { applicantId: { in: [applicantA, applicantB] } } });
      const applicationIds = [applicationA, applicationB, seededApplication];
      await database.appointment.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await database.paymentAttempt.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await database.feeSnapshot.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await database.application.deleteMany({ where: { id: { in: applicationIds } } });
      await database.appointmentSlot.deleteMany({ where: { id: slotId } });
      await database.rto.deleteMany({ where: { id: rtoId } });
      await database.applicant.deleteMany({ where: { id: { in: [applicantA, applicantB, seededApplicant] } } });
    } finally {
      await database.$disconnect();
    }
  });

  it("allows exactly one concurrent winner for the final slot, owner-scopes it, and releases capacity on cancellation", async () => {
    if (!database) return;
    await database.applicant.createMany({ data: [
      { id: applicantA, mobileLookupHash: `phase5-${applicantA}`, mobileLast4: "0000", displayName: "Phase 5 A" },
      { id: applicantB, mobileLookupHash: `phase5-${applicantB}`, mobileLast4: "0001", displayName: "Phase 5 B" },
    ] });
    await database.rto.create({ data: {
      id: rtoId,
      code: `SYNTHETIC_TEST_${randomUUID().replace(/[0-9-]/g, "A").slice(0, 8).toUpperCase()}`,
      nameEn: "Synthetic Test RTO",
      nameHi: "कृत्रिम परीक्षण आरटीओ",
      district: "Test Delhi",
    } });
    await database.appointmentSlot.create({ data: {
      id: slotId,
      rtoId,
      serviceKey: "LEARNER_LICENCE",
      date: new Date("2026-08-28T00:00:00.000Z"),
      startTime: "09:00",
      endTime: "09:30",
      capacity: 1,
      releasedAt: new Date("2026-08-24T00:00:00.000Z"),
    } });

    for (const [applicantId, applicationId] of [[applicantA, applicationA], [applicantB, applicationB]] as const) {
      const feeId = randomUUID();
      await database.application.create({ data: {
        id: applicationId,
        applicantId,
        serviceKey: "LEARNER_LICENCE",
        status: "READY_FOR_APPOINTMENT",
      } });
      await database.feeSnapshot.create({ data: {
        id: feeId,
        applicationId,
        baseFeeMinor: 50_000,
        serviceChargeMinor: 5_000,
        totalAmountMinor: 55_000,
        currency: "INR",
      } });
      await database.paymentAttempt.create({ data: {
        applicationId,
        feeSnapshotId: feeId,
        attemptNumber: 1,
        idempotencyKey: randomUUID(),
        providerReference: `SYN-PAY-${randomUUID().toUpperCase()}`,
        status: "SUCCEEDED",
        amountMinor: 55_000,
        succeededAt: now,
      } });
    }

    const results = await Promise.allSettled([
      bookAppointment(contextA, { applicationId: applicationA, slotId, correlationId: "phase5-race-a", now }, database),
      bookAppointment(contextB, { applicationId: applicationB, slotId, correlationId: "phase5-race-b", now }, database),
    ]);
    const fulfilled = results.filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof bookAppointment>>> => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(String(rejected[0]?.reason)).toContain("CAPACITY_FULL");
    expect((await database.appointmentSlot.findUniqueOrThrow({ where: { id: slotId } })).bookedCount).toBe(1);
    expect(await database.appointment.count({ where: { slotId, status: "CONFIRMED" } })).toBe(1);

    const winner = fulfilled[0]?.value;
    if (!winner) throw new Error("The final-slot race did not produce a winner.");
    const winnerContext = winner.applicationId === applicationA ? contextA : contextB;
    const loserContext = winner.applicationId === applicationA ? contextB : contextA;
    const repeated = await bookAppointment(winnerContext, {
      applicationId: winner.applicationId,
      slotId,
      correlationId: "phase5-idempotent-book",
      now,
    }, database);
    expect(repeated.id).toBe(winner.id);
    expect((await database.appointmentSlot.findUniqueOrThrow({ where: { id: slotId } })).bookedCount).toBe(1);
    expect(await database.applicationEvent.count({ where: {
      applicationId: winner.applicationId,
      eventType: "APPOINTMENT_BOOKED",
    } })).toBe(1);
    await expect(cancelAppointment(loserContext, {
      appointmentId: winner.id,
      correlationId: "phase5-cross-user",
      now,
    }, database)).rejects.toThrowError(/RESOURCE_NOT_FOUND/);
    expect(await listAppointments(loserContext, database)).toHaveLength(0);
    expect((await getDaySlots({ rtoId, date: "2026-08-28", serviceKey: "LEARNER_LICENCE", now }, database)).status)
      .toBe("CAPACITY_FULL");

    const cancelled = await cancelAppointment(winnerContext, {
      appointmentId: winner.id,
      correlationId: "phase5-cancel",
      now: new Date("2026-08-25T12:01:00.000Z"),
    }, database);
    expect(cancelled.status).toBe("CANCELLED");
    expect((await database.appointmentSlot.findUniqueOrThrow({ where: { id: slotId } })).bookedCount).toBe(0);
    const repeatedCancellation = await cancelAppointment(winnerContext, {
      appointmentId: winner.id,
      correlationId: "phase5-idempotent-cancel",
      now: new Date("2026-08-25T12:01:01.000Z"),
    }, database);
    expect(repeatedCancellation.status).toBe("CANCELLED");
    expect((await database.appointmentSlot.findUniqueOrThrow({ where: { id: slotId } })).bookedCount).toBe(0);
    expect(await database.applicationEvent.count({ where: {
      applicationId: winner.applicationId,
      eventType: { in: ["APPOINTMENT_BOOKED", "APPOINTMENT_CANCELLED"] },
    } })).toBe(2);
    const audit = await database.auditEvent.findMany({ where: { resourceId: winner.id }, orderBy: { createdAt: "asc" } });
    expect(audit.map((event) => event.eventType)).toEqual(["APPOINTMENT_BOOKED", "APPOINTMENT_CANCELLED"]);
    expect(JSON.stringify(audit)).not.toMatch(/session|token|secret/i);

    await database.appointmentRateLimitBucket.create({ data: {
      applicantId: winnerContext.applicantId,
      action: "BOOK",
      bucketStart: new Date("2026-08-25T12:02:00.000Z"),
      count: 20,
    } });
    await expect(bookAppointment(winnerContext, {
      applicationId: winner.applicationId,
      slotId,
      correlationId: "phase5-rate-limit",
      now: new Date("2026-08-25T12:02:30.000Z"),
    }, database)).rejects.toThrowError(/APPOINTMENT_RATE_LIMITED/);
  });

  it("preserves a referenced seeded schedule and reconciles capacity from confirmed appointments", async () => {
    if (!database) return;

    await seedSyntheticAppointments(database, { seedDate: "2026-08-25" });
    await database.applicant.create({ data: {
      id: seededApplicant,
      mobileLookupHash: `phase5-seed-${seededApplicant}`,
      mobileLast4: "0002",
      displayName: "Phase 5 Seed",
    } });
    await database.application.create({ data: {
      id: seededApplication,
      applicantId: seededApplicant,
      serviceKey: "LEARNER_LICENCE",
      status: "APPOINTMENT_BOOKED",
    } });
    await database.appointmentSlot.update({ where: { id: seededSlotId }, data: { bookedCount: 0 } });
    await database.appointment.create({ data: {
      applicationId: seededApplication,
      applicantId: seededApplicant,
      slotId: seededSlotId,
      status: "CONFIRMED",
      bookedAt: now,
    } });

    await seedSyntheticAppointments(database, { seedDate: "2026-09-01" });

    const slot = await database.appointmentSlot.findUniqueOrThrow({ where: { id: seededSlotId } });
    expect(slot.date.toISOString().slice(0, 10)).toBe("2026-08-26");
    expect(slot.bookedCount).toBe(1);
    expect(await database.appointment.count({ where: { slotId: seededSlotId, status: "CONFIRMED" } })).toBe(1);
  });
});

import { randomUUID } from "node:crypto";

import type { ApplicationStatus, WaitlistStatus, WaitlistTimeBucket } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";

import { isDisposableDatabaseApproved } from "@/server/auth/database-test-safety";
import { bookAppointment } from "@/server/appointments/appointment-service";
import { createDatabaseTestClient } from "@/server/database/database-test-client";

import { acceptOffer, allocateSlot, declineOffer, leaveWaitlist, listWaitlistEntries } from "./waitlist-service";

const testUrl = process.env.TEST_DATABASE_URL;
const approved = isDisposableDatabaseApproved({
  testDatabaseUrl: testUrl,
  primaryDatabaseUrl: process.env.DATABASE_URL,
  confirmation: process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION,
});
if ((testUrl || process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION) && !approved) {
  throw new Error("Refusing Phase 6 database tests: database identities are not safely distinct.");
}
const database = approved ? createDatabaseTestClient(testUrl) : undefined;
const applicantIds: string[] = [];
const rtoIds: string[] = [];
const testDate = new Date("2026-09-10T00:00:00.000Z");
const releasedAt = new Date("2026-08-25T00:00:00.000Z");

async function createApplication(
  status: ApplicationStatus,
  options: Readonly<{ paid?: boolean; applicantId?: string }> = {},
) {
  if (!database) throw new Error("Disposable database is unavailable.");
  const applicantId = options.applicantId ?? randomUUID();
  const applicationId = randomUUID();
  applicantIds.push(applicantId);
  await database.applicant.create({ data: {
    id: applicantId,
    mobileLookupHash: `phase6-${applicantId}`,
    mobileLast4: applicantId.slice(-4),
    displayName: "Phase 6 Synthetic Citizen",
  } });
  await database.application.create({ data: {
    id: applicationId,
    applicantId,
    serviceKey: "LEARNER_LICENCE",
    status,
  } });
  if (options.paid) {
    const feeSnapshotId = randomUUID();
    await database.feeSnapshot.create({ data: {
      id: feeSnapshotId,
      applicationId,
      baseFeeMinor: 50_000,
      serviceChargeMinor: 5_000,
      totalAmountMinor: 55_000,
      currency: "INR",
    } });
    await database.paymentAttempt.create({ data: {
      applicationId,
      feeSnapshotId,
      attemptNumber: 1,
      idempotencyKey: randomUUID(),
      providerReference: `SYN-PHASE6-${randomUUID().toUpperCase()}`,
      status: "SUCCEEDED",
      amountMinor: 55_000,
      succeededAt: releasedAt,
    } });
  }
  return {
    applicantId,
    applicationId,
    context: { sessionId: randomUUID(), applicantId },
  };
}

async function createRto() {
  if (!database) throw new Error("Disposable database is unavailable.");
  const id = randomUUID();
  const codeSuffix = id.replaceAll("-", "").slice(0, 12).split("")
    .map((character) => String.fromCharCode(65 + Number.parseInt(character, 16))).join("");
  rtoIds.push(id);
  return database.rto.create({ data: {
    id,
    code: `SYNTHETIC_${codeSuffix}`,
    nameEn: "Phase 6 Synthetic RTO",
    nameHi: "कृत्रिम चरण 6 आरटीओ",
    district: "Synthetic Delhi",
  } });
}

async function createSlot(
  rtoId: string,
  input: Readonly<{ capacity?: number; bookedCount?: number; heldCount?: number; startTime?: string }> = {},
) {
  if (!database) throw new Error("Disposable database is unavailable.");
  const startTime = input.startTime ?? "09:00";
  const [hourText, minuteText] = startTime.split(":");
  const endMinutes = Number(hourText) * 60 + Number(minuteText) + 30;
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
  return database.appointmentSlot.create({ data: {
    id: randomUUID(),
    rtoId,
    serviceKey: "LEARNER_LICENCE",
    date: testDate,
    startTime,
    endTime,
    capacity: input.capacity ?? 1,
    bookedCount: input.bookedCount ?? 0,
    heldCount: input.heldCount ?? 0,
    releasedAt,
  } });
}

async function createEntry(
  application: Awaited<ReturnType<typeof createApplication>>,
  rtoId: string,
  input: Readonly<{
    status?: WaitlistStatus;
    joinedAt?: Date;
    timeBuckets?: readonly WaitlistTimeBucket[];
    id?: string;
  }> = {},
) {
  if (!database) throw new Error("Disposable database is unavailable.");
  return database.waitlistEntry.create({ data: {
    id: input.id ?? randomUUID(),
    applicationId: application.applicationId,
    applicantId: application.applicantId,
    rtoId,
    serviceKey: "LEARNER_LICENCE",
    vehicleClass: "LMV",
    acceptableDateFrom: testDate,
    acceptableDateTo: testDate,
    timeBuckets: [...(input.timeBuckets ?? ["MORNING"])],
    status: input.status ?? "ACTIVE",
    joinedAt: input.joinedAt ?? releasedAt,
  } });
}

async function createActiveOffer(
  entryId: string,
  slotId: string,
  offeredAt: Date,
  expiresAt = new Date(offeredAt.getTime() + 30 * 60 * 1000),
) {
  if (!database) throw new Error("Disposable database is unavailable.");
  return database.slotOffer.create({ data: { id: randomUUID(), waitlistEntryId: entryId, slotId, offeredAt, expiresAt } });
}

describe.skipIf(!database)("Phase 6 disposable PostgreSQL waitlist invariants", () => {
  afterAll(async () => {
    if (!database) return;
    try {
      const applications = await database.application.findMany({
        where: { applicantId: { in: applicantIds } },
        select: { id: true },
      });
      const applicationIds = applications.map(({ id }) => id);
      await database.auditEvent.deleteMany({ where: { actorApplicantId: { in: applicantIds } } });
      await database.waitlistRateLimitBucket.deleteMany({ where: { applicantId: { in: applicantIds } } });
      await database.appointmentRateLimitBucket.deleteMany({ where: { applicantId: { in: applicantIds } } });
      await database.slotOffer.deleteMany({ where: { waitlistEntry: { applicantId: { in: applicantIds } } } });
      await database.waitlistEntry.deleteMany({ where: { applicantId: { in: applicantIds } } });
      await database.appointment.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await database.paymentAttempt.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await database.feeSnapshot.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await database.applicationEvent.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await database.application.deleteMany({ where: { id: { in: applicationIds } } });
      await database.appointmentSlot.deleteMany({ where: { rtoId: { in: rtoIds } } });
      await database.rto.deleteMany({ where: { id: { in: rtoIds } } });
      await database.applicant.deleteMany({ where: { id: { in: applicantIds } } });
    } finally {
      await database.$disconnect();
    }
  });

  it("expires only the requesting applicant's offers and never releases a hold twice", async () => {
    if (!database) return;
    const now = new Date("2026-08-26T12:00:00.000Z");
    const rto = await createRto();
    const first = await createApplication("APPOINTMENT_BOOKED");
    const second = await createApplication("SLOT_OFFERED");
    const firstSlot = await createSlot(rto.id, { heldCount: 1 });
    const secondSlot = await createSlot(rto.id, { heldCount: 1, startTime: "14:00" });
    const firstEntry = await createEntry(first, rto.id, { status: "OFFERED" });
    const secondEntry = await createEntry(second, rto.id, { status: "OFFERED", timeBuckets: ["AFTERNOON"] });
    const firstOffer = await createActiveOffer(firstEntry.id, firstSlot.id, new Date("2026-08-26T11:00:00.000Z"));
    const secondOffer = await createActiveOffer(secondEntry.id, secondSlot.id, new Date("2026-08-26T11:00:00.000Z"));

    await listWaitlistEntries(first.context, { now, correlationId: "phase6-scoped-expiry" }, database);
    expect(await database.slotOffer.findUniqueOrThrow({ where: { id: firstOffer.id } })).toMatchObject({ status: "EXPIRED" });
    expect(await database.slotOffer.findUniqueOrThrow({ where: { id: secondOffer.id } })).toMatchObject({ status: "ACTIVE" });
    expect((await database.appointmentSlot.findUniqueOrThrow({ where: { id: firstSlot.id } })).heldCount).toBe(0);
    expect((await database.appointmentSlot.findUniqueOrThrow({ where: { id: secondSlot.id } })).heldCount).toBe(1);
    expect((await database.application.findUniqueOrThrow({ where: { id: first.applicationId } })).status).toBe("APPOINTMENT_BOOKED");
    expect(await database.slotOffer.count({ where: { waitlistEntryId: firstEntry.id, slotId: firstSlot.id } })).toBe(1);

    await listWaitlistEntries(first.context, { now: new Date(now.getTime() + 1_000), correlationId: "phase6-repeat-expiry" }, database);
    expect((await database.appointmentSlot.findUniqueOrThrow({ where: { id: firstSlot.id } })).heldCount).toBe(0);
    expect(await database.applicationEvent.count({ where: { applicationId: first.applicationId, eventType: "SLOT_OFFER_EXPIRED" } })).toBe(1);
  });

  it("decline and leave release holds once without regressing booked applications", async () => {
    if (!database) return;
    const now = new Date("2026-08-26T12:00:00.000Z");
    const rto = await createRto();
    const declining = await createApplication("APPOINTMENT_BOOKED");
    const leaving = await createApplication("APPOINTMENT_BOOKED");
    const declineSlot = await createSlot(rto.id, { heldCount: 1 });
    const leaveSlot = await createSlot(rto.id, { heldCount: 1, startTime: "14:00" });
    const declineEntry = await createEntry(declining, rto.id, { status: "OFFERED" });
    const leaveEntry = await createEntry(leaving, rto.id, { status: "OFFERED", timeBuckets: ["AFTERNOON"] });
    const declinedOffer = await createActiveOffer(declineEntry.id, declineSlot.id, now);
    await createActiveOffer(leaveEntry.id, leaveSlot.id, now);

    await declineOffer(declining.context, declinedOffer.id, { now, correlationId: "phase6-decline" }, database);
    await declineOffer(declining.context, declinedOffer.id, { now, correlationId: "phase6-decline-repeat" }, database);
    await leaveWaitlist(leaving.context, leaveEntry.id, { now, correlationId: "phase6-leave" }, database);
    await leaveWaitlist(leaving.context, leaveEntry.id, { now, correlationId: "phase6-leave-repeat" }, database);

    expect((await database.appointmentSlot.findUniqueOrThrow({ where: { id: declineSlot.id } })).heldCount).toBe(0);
    expect((await database.appointmentSlot.findUniqueOrThrow({ where: { id: leaveSlot.id } })).heldCount).toBe(0);
    expect((await database.application.findUniqueOrThrow({ where: { id: declining.applicationId } })).status).toBe("APPOINTMENT_BOOKED");
    expect((await database.application.findUniqueOrThrow({ where: { id: leaving.applicationId } })).status).toBe("APPOINTMENT_BOOKED");
  });

  it("blocks direct booking with an active offer and fulfills the entry after an expired offer", async () => {
    if (!database) return;
    const now = new Date("2026-08-26T12:00:00.000Z");
    const rto = await createRto();
    const blocked = await createApplication("SLOT_OFFERED", { paid: true });
    const recovering = await createApplication("SLOT_OFFERED", { paid: true });
    const blockedOfferSlot = await createSlot(rto.id, { heldCount: 1 });
    const blockedTarget = await createSlot(rto.id, { startTime: "14:00" });
    const expiredOfferSlot = await createSlot(rto.id, { heldCount: 1, startTime: "15:00" });
    const recoveryTarget = await createSlot(rto.id, { startTime: "16:00" });
    const blockedEntry = await createEntry(blocked, rto.id, { status: "OFFERED" });
    const recoveryEntry = await createEntry(recovering, rto.id, { status: "OFFERED", timeBuckets: ["AFTERNOON"] });
    await createActiveOffer(blockedEntry.id, blockedOfferSlot.id, now);
    await createActiveOffer(recoveryEntry.id, expiredOfferSlot.id, new Date("2026-08-26T11:00:00.000Z"));

    await expect(bookAppointment(blocked.context, {
      applicationId: blocked.applicationId, slotId: blockedTarget.id, now, correlationId: "phase6-direct-blocked",
    }, database)).rejects.toThrowError(/WAITLIST_OFFER_ACTIVE/);
    expect((await database.appointmentSlot.findUniqueOrThrow({ where: { id: blockedTarget.id } })).bookedCount).toBe(0);
    expect((await database.appointmentSlot.findUniqueOrThrow({ where: { id: blockedOfferSlot.id } })).heldCount).toBe(1);

    const appointment = await bookAppointment(recovering.context, {
      applicationId: recovering.applicationId, slotId: recoveryTarget.id, now, correlationId: "phase6-direct-after-expiry",
    }, database);
    expect(appointment.status).toBe("CONFIRMED");
    expect((await database.waitlistEntry.findUniqueOrThrow({ where: { id: recoveryEntry.id } })).status).toBe("FULFILLED");
    expect((await database.appointmentSlot.findUniqueOrThrow({ where: { id: expiredOfferSlot.id } })).heldCount).toBe(0);
    expect((await database.appointmentSlot.findUniqueOrThrow({ where: { id: recoveryTarget.id } })).bookedCount).toBe(1);
  });

  it("rejects offer acceptance when a confirmed appointment already exists", async () => {
    if (!database) return;
    const now = new Date("2026-08-26T12:00:00.000Z");
    const rto = await createRto();
    const application = await createApplication("APPOINTMENT_BOOKED");
    const bookedSlot = await createSlot(rto.id, { bookedCount: 1 });
    const offeredSlot = await createSlot(rto.id, { heldCount: 1, startTime: "14:00" });
    await database.appointment.create({ data: {
      applicationId: application.applicationId,
      applicantId: application.applicantId,
      slotId: bookedSlot.id,
      status: "CONFIRMED",
      bookedAt: now,
    } });
    const entry = await createEntry(application, rto.id, { status: "OFFERED", timeBuckets: ["AFTERNOON"] });
    const offer = await createActiveOffer(entry.id, offeredSlot.id, now);

    await expect(acceptOffer(application.context, offer.id, { now, correlationId: "phase6-confirmed-conflict" }, database))
      .rejects.toThrowError(/OFFER_STATE_CONFLICT/);
    expect((await database.appointment.findUniqueOrThrow({ where: { applicationId: application.applicationId } })).slotId).toBe(bookedSlot.id);
    expect((await database.appointmentSlot.findUniqueOrThrow({ where: { id: bookedSlot.id } })).bookedCount).toBe(1);
    expect(await database.appointmentSlot.findUniqueOrThrow({ where: { id: offeredSlot.id } })).toMatchObject({ bookedCount: 0, heldCount: 1 });
  });

  it("accepts a 30-minute offer idempotently without double-counting capacity", async () => {
    if (!database) return;
    const offeredAt = new Date("2026-08-26T12:00:00.000Z");
    const rto = await createRto();
    const application = await createApplication("SLOT_OFFERED");
    const slot = await createSlot(rto.id, { heldCount: 1 });
    const entry = await createEntry(application, rto.id, { status: "OFFERED" });
    const offer = await createActiveOffer(entry.id, slot.id, offeredAt);
    expect(offer.expiresAt.getTime() - offer.offeredAt.getTime()).toBe(30 * 60 * 1000);

    const accepted = await acceptOffer(application.context, offer.id, {
      now: new Date(offeredAt.getTime() + 1_000), correlationId: "phase6-accept",
    }, database);
    const repeated = await acceptOffer(application.context, offer.id, {
      now: new Date(offeredAt.getTime() + 2_000), correlationId: "phase6-accept-repeat",
    }, database);
    expect(repeated.id).toBe(accepted.id);
    expect(await database.appointmentSlot.findUniqueOrThrow({ where: { id: slot.id } })).toMatchObject({ bookedCount: 1, heldCount: 0 });
    expect(await database.applicationEvent.count({ where: { applicationId: application.applicationId, eventType: "SLOT_OFFER_ACCEPTED" } })).toBe(1);
  });

  it("persists expiry and rejects acceptance after the exact server deadline", async () => {
    if (!database) return;
    const offeredAt = new Date("2026-08-26T12:00:00.000Z");
    const expiresAt = new Date(offeredAt.getTime() + 30 * 60 * 1000);
    const rto = await createRto();
    const application = await createApplication("SLOT_OFFERED");
    const slot = await createSlot(rto.id, { heldCount: 1 });
    const entry = await createEntry(application, rto.id, { status: "OFFERED" });
    const offer = await createActiveOffer(entry.id, slot.id, offeredAt, expiresAt);

    await expect(acceptOffer(application.context, offer.id, {
      now: expiresAt, correlationId: "phase6-expired-accept",
    }, database)).rejects.toThrowError(/OFFER_EXPIRED/);
    expect((await database.slotOffer.findUniqueOrThrow({ where: { id: offer.id } })).status).toBe("EXPIRED");
    expect((await database.appointmentSlot.findUniqueOrThrow({ where: { id: slot.id } })).heldCount).toBe(0);
    expect(await database.appointment.count({ where: { applicationId: application.applicationId } })).toBe(0);
  });

  it("allocates concurrently by compatibility, join time, and UUID without exceeding capacity", async () => {
    if (!database) return;
    const now = new Date("2026-08-26T12:00:00.000Z");
    const rto = await createRto();
    const slot = await createSlot(rto.id, { capacity: 2 });
    const incompatible = await createApplication("WAITLISTED");
    const earliest = await createApplication("WAITLISTED");
    const tiedA = await createApplication("WAITLISTED");
    const tiedB = await createApplication("WAITLISTED");
    await createEntry(incompatible, rto.id, { joinedAt: new Date("2026-08-26T08:00:00.000Z"), timeBuckets: ["AFTERNOON"] });
    const earliestEntry = await createEntry(earliest, rto.id, { joinedAt: new Date("2026-08-26T09:00:00.000Z") });
    const tiedEntryA = await createEntry(tiedA, rto.id, { joinedAt: new Date("2026-08-26T10:00:00.000Z") });
    const tiedEntryB = await createEntry(tiedB, rto.id, { joinedAt: new Date("2026-08-26T10:00:00.000Z") });
    const expectedTieWinner = [tiedEntryA.id, tiedEntryB.id].sort()[0];
    const expectedRemaining = [tiedEntryA.id, tiedEntryB.id].find((id) => id !== expectedTieWinner);

    await Promise.all([
      allocateSlot(slot.id, { now, correlationId: "phase6-allocator-a" }, database),
      allocateSlot(slot.id, { now, correlationId: "phase6-allocator-b" }, database),
    ]);
    const firstOffers = await database.slotOffer.findMany({ where: { slotId: slot.id, status: "ACTIVE" } });
    expect(new Set(firstOffers.map(({ waitlistEntryId }) => waitlistEntryId))).toEqual(new Set([earliestEntry.id, expectedTieWinner]));
    expect((await database.appointmentSlot.findUniqueOrThrow({ where: { id: slot.id } })).heldCount).toBe(2);
    expect(await database.slotOffer.count({ where: { slotId: slot.id } })).toBe(2);

    const earliestOffer = firstOffers.find(({ waitlistEntryId }) => waitlistEntryId === earliestEntry.id);
    if (!earliestOffer) throw new Error("FIFO allocation did not offer the earliest compatible entry.");
    await declineOffer(earliest.context, earliestOffer.id, { now, correlationId: "phase6-reallocate" }, database);
    expect(await database.slotOffer.count({ where: { waitlistEntryId: earliestEntry.id, slotId: slot.id } })).toBe(1);
    expect(await database.slotOffer.count({ where: { waitlistEntryId: expectedRemaining, slotId: slot.id, status: "ACTIVE" } })).toBe(1);
    const finalSlot = await database.appointmentSlot.findUniqueOrThrow({ where: { id: slot.id } });
    expect(finalSlot.bookedCount + finalSlot.heldCount).toBeLessThanOrEqual(finalSlot.capacity);
  });
});

import "server-only";

import type { JoinWaitlistRequest, WaitlistEntry, WaitlistPreferences } from "@raahsathi/contracts/waitlist";
import { waitlistEntrySchema } from "@raahsathi/contracts/waitlist";
import {
  Prisma,
  type PrismaClient,
  type WaitlistRateLimitAction,
  type WaitlistTimeBucket,
} from "@prisma/client";

import { dependencyAvailabilityStatus, slotAvailabilityStatus } from "@/server/appointments/appointment-service";
import type { AuthenticatedContext } from "@/server/auth/auth-types";
import { prisma } from "@/server/database/prisma";
import { apiErrors } from "@/server/http/api-error";

import { expireOfferInTransaction, expireOffersInTransaction } from "./offer-expiry";

const offerLifetimeMs = 30 * 60 * 1000;
const mutationLimitPerMinute = 20;

const entryInclude = {
  rto: true,
  offers: { include: { slot: true }, orderBy: [{ offeredAt: "desc" as Prisma.SortOrder }, { id: "desc" as Prisma.SortOrder }], take: 1 },
} satisfies Prisma.WaitlistEntryInclude;

type EntryRecord = Prisma.WaitlistEntryGetPayload<{ include: typeof entryInclude }>;

function dateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function slotTimeBucket(startTime: string): WaitlistTimeBucket {
  return startTime < "12:00" ? "MORNING" : "AFTERNOON";
}

function entryOutput(entry: EntryRecord): WaitlistEntry {
  const offer = entry.offers[0];
  return waitlistEntrySchema.parse({
    id: entry.id,
    applicationId: entry.applicationId,
    serviceKey: entry.serviceKey,
    status: entry.status,
    vehicleClass: entry.vehicleClass,
    acceptableDateFrom: dateKey(entry.acceptableDateFrom),
    acceptableDateTo: dateKey(entry.acceptableDateTo),
    timeBuckets: entry.timeBuckets,
    joinedAt: entry.joinedAt.toISOString(),
    rto: {
      id: entry.rto.id, code: entry.rto.code, nameEn: entry.rto.nameEn, nameHi: entry.rto.nameHi,
      district: entry.rto.district, status: dependencyAvailabilityStatus(entry.rto),
    },
    offer: offer ? {
      id: offer.id, status: offer.status, offeredAt: offer.offeredAt.toISOString(), expiresAt: offer.expiresAt.toISOString(),
      slot: { id: offer.slot.id, date: dateKey(offer.slot.date), startTime: offer.slot.startTime,
        endTime: offer.slot.endTime, vehicleClass: offer.slot.vehicleClass },
    } : null,
  });
}

function isSerializationConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  return error.code === "P2034" || (error.code === "P2010" && error.meta?.code === "40001");
}

async function enforceRateLimit(
  context: AuthenticatedContext,
  action: WaitlistRateLimitAction,
  now: Date,
  database: PrismaClient,
): Promise<void> {
  const bucketStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
  const bucket = await database.waitlistRateLimitBucket.upsert({
    where: { applicantId_action_bucketStart: { applicantId: context.applicantId, action, bucketStart } },
    create: { applicantId: context.applicantId, action, bucketStart },
    update: { count: { increment: 1 } },
  });
  if (bucket.count > mutationLimitPerMinute) throw apiErrors.waitlistRateLimited();
}

async function writeEvent(
  database: Prisma.TransactionClient,
  input: Readonly<{ applicationId: string; applicantId: string; eventType: Prisma.ApplicationEventCreateInput["eventType"];
    correlationId: string; resourceType: "WaitlistEntry" | "SlotOffer"; resourceId: string; metadata?: Prisma.InputJsonObject }>,
): Promise<void> {
  await database.applicationEvent.create({ data: {
    applicationId: input.applicationId, actorApplicantId: input.applicantId,
    eventType: input.eventType, correlationId: input.correlationId,
  } });
  await database.auditEvent.create({ data: {
    actorApplicantId: input.applicantId, eventType: input.eventType,
    resourceType: input.resourceType, resourceId: input.resourceId,
    correlationId: input.correlationId, metadata: input.metadata,
  } });
}

async function allocateReleasedSlots(
  slotIds: readonly string[],
  input: Readonly<{ now: Date; correlationId: string }>,
  database: PrismaClient,
): Promise<void> {
  for (const slotId of new Set(slotIds)) await allocateSlot(slotId, input, database);
}

export async function allocateSlot(
  slotId: string,
  input: Readonly<{ now: Date; correlationId: string }>,
  database: PrismaClient = prisma,
  retry = true,
): Promise<void> {
  try {
    await database.$transaction(async (tx) => {
      await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "AppointmentSlot" WHERE "id" = ${slotId}::uuid FOR UPDATE`);
      await expireOffersInTransaction(tx, {
        now: input.now, correlationId: input.correlationId, scope: { kind: "slot", slotId },
      });
      const slot = await tx.appointmentSlot.findUnique({ where: { id: slotId }, include: { rto: true } });
      if (!slot || slotAvailabilityStatus(slot, slot.rto, input.now) !== "AVAILABLE") return;
      const free = slot.capacity - slot.bookedCount - slot.heldCount;
      if (free <= 0) return;
      const bucket = slotTimeBucket(slot.startTime);
      let allocated = 0;
      while (allocated < free) {
        const entry = await tx.waitlistEntry.findFirst({
          where: {
            status: "ACTIVE", rtoId: slot.rtoId, serviceKey: slot.serviceKey, vehicleClass: slot.vehicleClass,
            acceptableDateFrom: { lte: slot.date }, acceptableDateTo: { gte: slot.date }, timeBuckets: { has: bucket },
            offers: { none: { slotId } },
            application: { status: "WAITLISTED" },
          },
          orderBy: [{ joinedAt: "asc" }, { id: "asc" }],
        });
        if (!entry) break;
        await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "WaitlistEntry" WHERE "id" = ${entry.id}::uuid FOR UPDATE`);
        const currentEntry = await tx.waitlistEntry.findFirst({ where: {
          id: entry.id,
          status: "ACTIVE",
          rtoId: slot.rtoId,
          serviceKey: slot.serviceKey,
          vehicleClass: slot.vehicleClass,
          acceptableDateFrom: { lte: slot.date },
          acceptableDateTo: { gte: slot.date },
          timeBuckets: { has: bucket },
          offers: { none: { slotId } },
          application: { status: "WAITLISTED" },
        } });
        if (!currentEntry) continue;
        const offeredAt = input.now;
        const offer = await tx.slotOffer.create({ data: {
          waitlistEntryId: currentEntry.id, slotId, offeredAt, expiresAt: new Date(offeredAt.getTime() + offerLifetimeMs),
        } });
        await tx.appointmentSlot.update({ where: { id: slotId }, data: { heldCount: { increment: 1 } } });
        const entryChanged = await tx.waitlistEntry.updateMany({ where: { id: currentEntry.id, status: "ACTIVE" }, data: { status: "OFFERED" } });
        const applicationChanged = await tx.application.updateMany({ where: { id: currentEntry.applicationId, status: "WAITLISTED" }, data: { status: "SLOT_OFFERED" } });
        if (entryChanged.count !== 1 || applicationChanged.count !== 1) throw apiErrors.offerStateConflict();
        await writeEvent(tx, {
          applicationId: currentEntry.applicationId, applicantId: currentEntry.applicantId, eventType: "SLOT_OFFER_CREATED",
          correlationId: input.correlationId, resourceType: "SlotOffer", resourceId: offer.id,
          metadata: { waitlistEntryId: currentEntry.id, slotId },
        });
        allocated += 1;
      }
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (retry && isSerializationConflict(error)) return allocateSlot(slotId, input, database, false);
    throw error;
  }
}

async function allocateCompatibleSlots(entryId: string, now: Date, correlationId: string, database: PrismaClient): Promise<void> {
  const entry = await database.waitlistEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.status !== "ACTIVE") return;
  const slots = await database.appointmentSlot.findMany({
    where: {
      rtoId: entry.rtoId, serviceKey: entry.serviceKey, vehicleClass: entry.vehicleClass,
      date: { gte: entry.acceptableDateFrom, lte: entry.acceptableDateTo }, releasedAt: { lte: now },
    }, orderBy: [{ date: "asc" }, { startTime: "asc" }, { id: "asc" }],
  });
  for (const slot of slots) {
    if (!entry.timeBuckets.includes(slotTimeBucket(slot.startTime))) continue;
    await allocateSlot(slot.id, { now, correlationId }, database);
    const current = await database.waitlistEntry.findUnique({ where: { id: entryId } });
    if (current?.status !== "ACTIVE") break;
  }
}

export async function joinWaitlist(
  context: AuthenticatedContext,
  request: JoinWaitlistRequest & Readonly<{ correlationId: string; now?: Date }>,
  database: PrismaClient = prisma,
): Promise<WaitlistEntry> {
  const now = request.now ?? new Date();
  await enforceRateLimit(context, "JOIN", now, database);
  const released = await database.$transaction((tx) => expireOffersInTransaction(tx, {
    now,
    correlationId: request.correlationId,
    scope: { kind: "applicant", applicantId: context.applicantId, applicationId: request.applicationId },
  }));
  await allocateReleasedSlots(released, { now, correlationId: request.correlationId }, database);
  const existing = await database.waitlistEntry.findFirst({
    where: { applicationId: request.applicationId, applicantId: context.applicantId, status: { in: ["ACTIVE", "OFFERED"] } },
    include: entryInclude,
  });
  if (existing) return entryOutput(existing);
  const application = await database.application.findFirst({
    where: { id: request.applicationId, applicantId: context.applicantId }, include: { paymentAttempts: true, appointment: true },
  });
  if (!application) throw apiErrors.notFound();
  if (application.status !== "READY_FOR_APPOINTMENT" || application.appointment?.status === "CONFIRMED"
    || !application.paymentAttempts.some((payment) => payment.status === "SUCCEEDED")) throw apiErrors.waitlistNotEligible();
  const entry = await database.$transaction(async (tx) => {
    const created = await tx.waitlistEntry.create({ data: {
      applicationId: application.id, applicantId: context.applicantId, rtoId: request.rtoId,
      serviceKey: application.serviceKey, vehicleClass: request.vehicleClass,
      acceptableDateFrom: new Date(`${request.acceptableDateFrom}T00:00:00.000Z`),
      acceptableDateTo: new Date(`${request.acceptableDateTo}T00:00:00.000Z`), timeBuckets: request.timeBuckets, joinedAt: now,
    } });
    await tx.application.update({ where: { id: application.id }, data: { status: "WAITLISTED" } });
    await writeEvent(tx, { applicationId: application.id, applicantId: context.applicantId, eventType: "WAITLIST_JOINED",
      correlationId: request.correlationId, resourceType: "WaitlistEntry", resourceId: created.id,
      metadata: { rtoId: request.rtoId, vehicleClass: request.vehicleClass } });
    return created.id;
  });
  await allocateCompatibleSlots(entry, now, request.correlationId, database);
  return getWaitlistEntry(context, entry, { now, correlationId: request.correlationId }, database);
}

export async function listWaitlistEntries(
  context: AuthenticatedContext,
  input: Readonly<{ applicationId?: string; now?: Date; correlationId: string }>,
  database: PrismaClient = prisma,
): Promise<readonly WaitlistEntry[]> {
  const now = input.now ?? new Date();
  const released = await database.$transaction((tx) => expireOffersInTransaction(tx, {
    now, correlationId: input.correlationId,
    scope: { kind: "applicant", applicantId: context.applicantId, applicationId: input.applicationId },
  }));
  await allocateReleasedSlots(released, { now, correlationId: input.correlationId }, database);
  const entries = await database.waitlistEntry.findMany({
    where: { applicantId: context.applicantId, applicationId: input.applicationId }, include: entryInclude,
    orderBy: [{ joinedAt: "desc" }, { id: "desc" }],
  });
  return entries.map(entryOutput);
}

export async function getWaitlistEntry(
  context: AuthenticatedContext,
  id: string,
  input: Readonly<{ now?: Date; correlationId: string }>,
  database: PrismaClient = prisma,
): Promise<WaitlistEntry> {
  const now = input.now ?? new Date();
  const released = await database.$transaction((tx) => expireOffersInTransaction(tx, {
    now, correlationId: input.correlationId, scope: { kind: "entry", entryId: id, applicantId: context.applicantId },
  }));
  await allocateReleasedSlots(released, { now, correlationId: input.correlationId }, database);
  const entry = await database.waitlistEntry.findFirst({ where: { id, applicantId: context.applicantId }, include: entryInclude });
  if (!entry) throw apiErrors.notFound();
  return entryOutput(entry);
}

export async function updateWaitlistEntry(
  context: AuthenticatedContext,
  id: string,
  request: WaitlistPreferences & Readonly<{ correlationId: string; now?: Date }>,
  database: PrismaClient = prisma,
): Promise<WaitlistEntry> {
  const now = request.now ?? new Date();
  await enforceRateLimit(context, "UPDATE", now, database);
  const released = await database.$transaction((tx) => expireOffersInTransaction(tx, {
    now, correlationId: request.correlationId, scope: { kind: "entry", entryId: id, applicantId: context.applicantId },
  }));
  await allocateReleasedSlots(released, { now, correlationId: request.correlationId }, database);
  const entry = await database.waitlistEntry.findFirst({ where: { id, applicantId: context.applicantId } });
  if (!entry) throw apiErrors.notFound();
  if (entry.status === "OFFERED") throw apiErrors.waitlistOfferActive();
  if (entry.status !== "ACTIVE") throw apiErrors.waitlistNotEligible();
  await database.$transaction(async (tx) => {
    await tx.waitlistEntry.update({ where: { id }, data: {
      rtoId: request.rtoId, acceptableDateFrom: new Date(`${request.acceptableDateFrom}T00:00:00.000Z`),
      acceptableDateTo: new Date(`${request.acceptableDateTo}T00:00:00.000Z`), timeBuckets: request.timeBuckets,
      vehicleClass: request.vehicleClass,
    } });
    await writeEvent(tx, { applicationId: entry.applicationId, applicantId: context.applicantId, eventType: "WAITLIST_UPDATED",
      correlationId: request.correlationId, resourceType: "WaitlistEntry", resourceId: id });
  });
  await allocateCompatibleSlots(id, now, request.correlationId, database);
  return getWaitlistEntry(context, id, { now, correlationId: request.correlationId }, database);
}

export async function leaveWaitlist(
  context: AuthenticatedContext,
  id: string,
  input: Readonly<{ correlationId: string; now?: Date }>,
  database: PrismaClient = prisma,
): Promise<void> {
  const now = input.now ?? new Date();
  await enforceRateLimit(context, "LEAVE", now, database);
  const released = await database.$transaction(async (tx) => {
    const expiredSlots = await expireOffersInTransaction(tx, {
      now, correlationId: input.correlationId, scope: { kind: "entry", entryId: id, applicantId: context.applicantId },
    });
    const entry = await tx.waitlistEntry.findFirst({ where: { id, applicantId: context.applicantId }, include: { offers: true } });
    if (!entry) throw apiErrors.notFound();
    if (entry.status === "LEFT" || entry.status === "FULFILLED") return expiredSlots;
    const offer = entry.offers.find((candidate) => candidate.status === "ACTIVE");
    if (offer) {
      const changed = await tx.slotOffer.updateMany({ where: { id: offer.id, status: "ACTIVE" }, data: { status: "DECLINED", declinedAt: now } });
      if (changed.count !== 1) throw apiErrors.offerStateConflict();
      const hold = await tx.appointmentSlot.updateMany({ where: { id: offer.slotId, heldCount: { gt: 0 } }, data: { heldCount: { decrement: 1 } } });
      if (hold.count !== 1) throw apiErrors.offerStateConflict();
    }
    await tx.waitlistEntry.update({ where: { id }, data: { status: "LEFT" } });
    await tx.application.updateMany({ where: { id: entry.applicationId, status: { in: ["WAITLISTED", "SLOT_OFFERED"] } }, data: { status: "READY_FOR_APPOINTMENT" } });
    await writeEvent(tx, { applicationId: entry.applicationId, applicantId: context.applicantId, eventType: "WAITLIST_LEFT",
      correlationId: input.correlationId, resourceType: "WaitlistEntry", resourceId: id });
    return offer ? [...expiredSlots, offer.slotId] : expiredSlots;
  });
  await allocateReleasedSlots(released, { now, correlationId: input.correlationId }, database);
}

export async function acceptOffer(
  context: AuthenticatedContext,
  id: string,
  input: Readonly<{ correlationId: string; now?: Date }>,
  database: PrismaClient = prisma,
): Promise<import("@raahsathi/contracts/appointments").Appointment> {
  const now = input.now ?? new Date();
  await enforceRateLimit(context, "ACCEPT_OFFER", now, database);
  const { appointmentOutputForWaitlist } = await import("@/server/appointments/appointment-service");
  const result = await database.$transaction(async (tx) => {
    const owned = await tx.slotOffer.findFirst({ where: { id, waitlistEntry: { applicantId: context.applicantId } },
      include: { waitlistEntry: true } });
    if (!owned) throw apiErrors.notFound();
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Application" WHERE "id" = ${owned.waitlistEntry.applicationId}::uuid FOR UPDATE`);
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "WaitlistEntry" WHERE "id" = ${owned.waitlistEntryId}::uuid FOR UPDATE`);
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "SlotOffer" WHERE "id" = ${id}::uuid FOR UPDATE`);
    const offer = await tx.slotOffer.findFirst({ where: { id, waitlistEntry: { applicantId: context.applicantId } },
      include: { waitlistEntry: true, slot: true } });
    if (!offer) throw apiErrors.notFound();
    if (offer.status === "ACCEPTED") {
      const appointment = await tx.appointment.findUnique({ where: { applicationId: offer.waitlistEntry.applicationId },
        include: { application: true, slot: { include: { rto: true } } } });
      if (!appointment || appointment.slotId !== offer.slotId) throw apiErrors.offerStateConflict();
      return { kind: "appointment" as const, appointment };
    }
    if (offer.status !== "ACTIVE") throw apiErrors.offerAlreadyConsumed();
    if (offer.expiresAt <= now) {
      const expired = await expireOfferInTransaction(tx, offer, now, input.correlationId);
      if (!expired) throw apiErrors.offerStateConflict();
      return { kind: "expired" as const, slotId: offer.slotId };
    }
    const existing = await tx.appointment.findUnique({ where: { applicationId: offer.waitlistEntry.applicationId } });
    if (existing?.status === "CONFIRMED") throw apiErrors.offerStateConflict();
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "AppointmentSlot" WHERE "id" = ${offer.slotId}::uuid FOR UPDATE`);
    const slotChanged = await tx.appointmentSlot.updateMany({ where: { id: offer.slotId, heldCount: { gt: 0 } },
      data: { heldCount: { decrement: 1 }, bookedCount: { increment: 1 } } });
    if (slotChanged.count !== 1) throw apiErrors.offerStateConflict();
    const appointment = existing ? await tx.appointment.update({ where: { id: existing.id }, data: {
      slotId: offer.slotId, status: "CONFIRMED", bookedAt: now, cancelledAt: null,
    }, include: { application: true, slot: { include: { rto: true } } } }) : await tx.appointment.create({ data: {
      applicationId: offer.waitlistEntry.applicationId, applicantId: context.applicantId, slotId: offer.slotId, bookedAt: now,
    }, include: { application: true, slot: { include: { rto: true } } } });
    await tx.slotOffer.update({ where: { id }, data: { status: "ACCEPTED", acceptedAt: now } });
    await tx.waitlistEntry.update({ where: { id: offer.waitlistEntryId }, data: { status: "FULFILLED" } });
    await tx.application.update({ where: { id: offer.waitlistEntry.applicationId }, data: { status: "APPOINTMENT_BOOKED" } });
    await writeEvent(tx, { applicationId: offer.waitlistEntry.applicationId, applicantId: context.applicantId,
      eventType: "SLOT_OFFER_ACCEPTED", correlationId: input.correlationId, resourceType: "SlotOffer", resourceId: id,
      metadata: { slotId: offer.slotId } });
    return { kind: "appointment" as const, appointment };
  }, { isolationLevel: "Serializable" });
  if (result.kind === "expired") {
    await allocateSlot(result.slotId, { now, correlationId: input.correlationId }, database);
    throw apiErrors.offerExpired();
  }
  return appointmentOutputForWaitlist(result.appointment);
}

export async function declineOffer(
  context: AuthenticatedContext,
  id: string,
  input: Readonly<{ correlationId: string; now?: Date }>,
  database: PrismaClient = prisma,
): Promise<WaitlistEntry> {
  const now = input.now ?? new Date();
  await enforceRateLimit(context, "DECLINE_OFFER", now, database);
  const result = await database.$transaction(async (tx) => {
    const owned = await tx.slotOffer.findFirst({ where: { id, waitlistEntry: { applicantId: context.applicantId } }, include: { waitlistEntry: true } });
    if (!owned) throw apiErrors.notFound();
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Application" WHERE "id" = ${owned.waitlistEntry.applicationId}::uuid FOR UPDATE`);
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "WaitlistEntry" WHERE "id" = ${owned.waitlistEntryId}::uuid FOR UPDATE`);
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "SlotOffer" WHERE "id" = ${id}::uuid FOR UPDATE`);
    const offer = await tx.slotOffer.findFirst({ where: { id, waitlistEntry: { applicantId: context.applicantId } }, include: { waitlistEntry: true } });
    if (!offer) throw apiErrors.notFound();
    if (offer.status === "DECLINED") return { entryId: offer.waitlistEntryId, releasedSlots: [] as string[] };
    if (offer.status !== "ACTIVE") throw apiErrors.offerStateConflict();
    if (offer.expiresAt <= now) {
      const expired = await expireOfferInTransaction(tx, offer, now, input.correlationId);
      if (!expired) throw apiErrors.offerStateConflict();
      return { entryId: offer.waitlistEntryId, releasedSlots: [offer.slotId] };
    }
    const changed = await tx.slotOffer.updateMany({ where: { id, status: "ACTIVE" }, data: { status: "DECLINED", declinedAt: now } });
    if (changed.count !== 1) throw apiErrors.offerStateConflict();
    const hold = await tx.appointmentSlot.updateMany({ where: { id: offer.slotId, heldCount: { gt: 0 } }, data: { heldCount: { decrement: 1 } } });
    if (hold.count !== 1) throw apiErrors.offerStateConflict();
    await tx.waitlistEntry.updateMany({ where: { id: offer.waitlistEntryId, status: "OFFERED" }, data: { status: "ACTIVE" } });
    await tx.application.updateMany({ where: { id: offer.waitlistEntry.applicationId, status: "SLOT_OFFERED" }, data: { status: "WAITLISTED" } });
    await writeEvent(tx, { applicationId: offer.waitlistEntry.applicationId, applicantId: context.applicantId,
      eventType: "SLOT_OFFER_DECLINED", correlationId: input.correlationId, resourceType: "SlotOffer", resourceId: id,
      metadata: { slotId: offer.slotId } });
    return { entryId: offer.waitlistEntryId, releasedSlots: [offer.slotId] };
  }, { isolationLevel: "Serializable" });
  await allocateReleasedSlots(result.releasedSlots, { now, correlationId: input.correlationId }, database);
  return getWaitlistEntry(context, result.entryId, { now, correlationId: input.correlationId }, database);
}

import "server-only";

import {
  appointmentListSchema,
  appointmentSchema,
  daySlotsSchema,
  monthAvailabilitySchema,
  rtoListSchema,
  type Appointment,
  type AvailabilityReasonCode,
  type DaySlots,
  type MonthAvailability,
} from "@raahsathi/contracts/appointments";
import type { ServiceKey } from "@raahsathi/contracts/applications";
import {
  Prisma,
  type AppointmentRateLimitAction,
  type AppointmentSlot,
  type BookingServiceStatus,
  type PrismaClient,
  type Rto,
  type RtoOperationalStatus,
} from "@prisma/client";

import type { AuthenticatedContext } from "@/server/auth/auth-types";
import { prisma } from "@/server/database/prisma";
import { apiErrors } from "@/server/http/api-error";

const appointmentMutationLimitPerMinute = 20;
const delhiUtcOffset = "+05:30";

type AppointmentRecord = Prisma.AppointmentGetPayload<{
  include: { application: true; slot: { include: { rto: true } } };
}>;

type SlotRecord = AppointmentSlot & { rto: Rto };

function dateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function slotHasElapsed(slot: Pick<AppointmentSlot, "date" | "startTime">, now: Date): boolean {
  const start = new Date(`${dateKey(slot.date)}T${slot.startTime}:00${delhiUtcOffset}`);
  return start <= now;
}

function monthBounds(month: string): Readonly<{ start: Date; end: Date; dayCount: number }> {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  return { start, end, dayCount: new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate() };
}

export function dependencyAvailabilityStatus(input: Readonly<{
  operationalStatus: RtoOperationalStatus;
  bookingServiceStatus: BookingServiceStatus;
}>): AvailabilityReasonCode {
  if (input.operationalStatus === "CENTER_UNAVAILABLE") return "CENTER_UNAVAILABLE";
  if (input.bookingServiceStatus === "BOOKING_SERVICE_UNAVAILABLE") return "BOOKING_SERVICE_UNAVAILABLE";
  return "AVAILABLE";
}

export function slotAvailabilityStatus(
  slot: Pick<AppointmentSlot, "capacity" | "bookedCount" | "releasedAt" | "date" | "startTime">,
  rto: Pick<Rto, "operationalStatus" | "bookingServiceStatus">,
  now: Date,
): AvailabilityReasonCode {
  const dependencyStatus = dependencyAvailabilityStatus(rto);
  if (dependencyStatus !== "AVAILABLE") return dependencyStatus;
  if (slotHasElapsed(slot, now)) return "SLOT_ELAPSED";
  if (!slot.releasedAt || slot.releasedAt > now) return "SLOTS_NOT_RELEASED";
  return slot.bookedCount >= slot.capacity ? "CAPACITY_FULL" : "AVAILABLE";
}

function rtoOutput(rto: Rto) {
  return {
    id: rto.id,
    code: rto.code,
    nameEn: rto.nameEn,
    nameHi: rto.nameHi,
    district: rto.district,
    status: dependencyAvailabilityStatus(rto),
  };
}

function appointmentOutput(record: AppointmentRecord): Appointment {
  return appointmentSchema.parse({
    id: record.id,
    applicationId: record.applicationId,
    slotId: record.slotId,
    serviceKey: record.application.serviceKey,
    status: record.status,
    rto: rtoOutput(record.slot.rto),
    date: dateKey(record.slot.date),
    startTime: record.slot.startTime,
    endTime: record.slot.endTime,
    bookedAt: record.bookedAt.toISOString(),
    cancelledAt: record.cancelledAt?.toISOString() ?? null,
  });
}

const appointmentInclude = {
  application: true,
  slot: { include: { rto: true } },
} as const;

export async function listRtos(databaseClient: PrismaClient = prisma) {
  const rtos = await databaseClient.rto.findMany({ orderBy: [{ district: "asc" }, { code: "asc" }] });
  return rtoListSchema.parse({ rtos: rtos.map(rtoOutput) });
}

async function requireRto(databaseClient: PrismaClient, rtoId: string): Promise<Rto> {
  const rto = await databaseClient.rto.findUnique({ where: { id: rtoId } });
  if (!rto) throw apiErrors.notFound();
  return rto;
}

function dayStatus(slots: readonly SlotRecord[], rto: Rto, now: Date): Readonly<{
  status: AvailabilityReasonCode;
  availableSlots: number;
}> {
  const dependencyStatus = dependencyAvailabilityStatus(rto);
  if (dependencyStatus !== "AVAILABLE") return { status: dependencyStatus, availableSlots: 0 };
  if (slots.length === 0) return { status: "SLOTS_NOT_RELEASED", availableSlots: 0 };
  const statuses = slots.map((slot) => slotAvailabilityStatus(slot, rto, now));
  const availableSlots = slots.reduce(
    (total, slot, index) => statuses[index] === "AVAILABLE"
      ? total + Math.max(0, slot.capacity - slot.bookedCount)
      : total,
    0,
  );
  if (availableSlots > 0) return { status: "AVAILABLE", availableSlots };
  if (statuses.includes("SLOTS_NOT_RELEASED")) return { status: "SLOTS_NOT_RELEASED", availableSlots: 0 };
  if (statuses.includes("CAPACITY_FULL")) return { status: "CAPACITY_FULL", availableSlots: 0 };
  return { status: "SLOT_ELAPSED", availableSlots: 0 };
}

export async function getMonthAvailability(
  input: Readonly<{ rtoId: string; month: string; serviceKey: ServiceKey; now?: Date }>,
  databaseClient: PrismaClient = prisma,
): Promise<MonthAvailability> {
  const now = input.now ?? new Date();
  const rto = await requireRto(databaseClient, input.rtoId);
  const { start, end, dayCount } = monthBounds(input.month);
  const slots = await databaseClient.appointmentSlot.findMany({
    where: { rtoId: rto.id, serviceKey: input.serviceKey, date: { gte: start, lt: end } },
    include: { rto: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  const slotsByDate = new Map<string, SlotRecord[]>();
  for (const slot of slots) {
    const key = dateKey(slot.date);
    const dateSlots = slotsByDate.get(key) ?? [];
    dateSlots.push(slot);
    slotsByDate.set(key, dateSlots);
  }
  const days = Array.from({ length: dayCount }, (_, index) => {
    const date = `${input.month}-${String(index + 1).padStart(2, "0")}`;
    return { date, ...dayStatus(slotsByDate.get(date) ?? [], rto, now) };
  });
  return monthAvailabilitySchema.parse({ rtoId: rto.id, serviceKey: input.serviceKey, month: input.month, days });
}

export async function getDaySlots(
  input: Readonly<{ rtoId: string; date: string; serviceKey: ServiceKey; now?: Date }>,
  databaseClient: PrismaClient = prisma,
): Promise<DaySlots> {
  const now = input.now ?? new Date();
  const rto = await requireRto(databaseClient, input.rtoId);
  const slots = await databaseClient.appointmentSlot.findMany({
    where: { rtoId: rto.id, serviceKey: input.serviceKey, date: new Date(`${input.date}T00:00:00.000Z`) },
    include: { rto: true },
    orderBy: [{ startTime: "asc" }, { id: "asc" }],
  });
  const summary = dayStatus(slots, rto, now);
  return daySlotsSchema.parse({
    rtoId: rto.id,
    serviceKey: input.serviceKey,
    date: input.date,
    status: summary.status,
    slots: slots.map((slot) => ({
      slotId: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity,
      remaining: Math.max(0, slot.capacity - slot.bookedCount),
      status: slotAvailabilityStatus(slot, rto, now),
    })),
  });
}

async function enforceMutationRateLimit(
  context: AuthenticatedContext,
  action: AppointmentRateLimitAction,
  now: Date,
  databaseClient: PrismaClient,
): Promise<void> {
  const bucketStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
  const bucket = await databaseClient.appointmentRateLimitBucket.upsert({
    where: { applicantId_action_bucketStart: { applicantId: context.applicantId, action, bucketStart } },
    create: { applicantId: context.applicantId, action, bucketStart, count: 1 },
    update: { count: { increment: 1 } },
  });
  if (bucket.count > appointmentMutationLimitPerMinute) throw apiErrors.appointmentRateLimited();
}

function assertSlotBookable(slot: SlotRecord, now: Date): void {
  const status = slotAvailabilityStatus(slot, slot.rto, now);
  if (status !== "AVAILABLE") throw apiErrors.appointmentUnavailable(status);
}

async function writeAppointmentAudit(
  database: Prisma.TransactionClient,
  input: Readonly<{
    context: AuthenticatedContext;
    appointmentId: string;
    eventType: "APPOINTMENT_BOOKED" | "APPOINTMENT_CANCELLED";
    correlationId: string;
    applicationId: string;
    slotId: string;
  }>,
): Promise<void> {
  await database.auditEvent.create({ data: {
    actorApplicantId: input.context.applicantId,
    eventType: input.eventType,
    resourceType: "Appointment",
    resourceId: input.appointmentId,
    correlationId: input.correlationId,
    metadata: { applicationId: input.applicationId, slotId: input.slotId },
  } });
}

export async function bookAppointment(
  context: AuthenticatedContext,
  input: Readonly<{ applicationId: string; slotId: string; correlationId: string; now?: Date }>,
  databaseClient: PrismaClient = prisma,
  retryOnSerializationConflict = true,
): Promise<Appointment> {
  const now = input.now ?? new Date();
  if (retryOnSerializationConflict) await enforceMutationRateLimit(context, "BOOK", now, databaseClient);
  try {
    const record = await databaseClient.$transaction(async (database) => {
      await database.$queryRaw(Prisma.sql`SELECT "id" FROM "Application" WHERE "id" = ${input.applicationId}::uuid AND "applicantId" = ${context.applicantId}::uuid FOR UPDATE`);
      const application = await database.application.findFirst({
        where: { id: input.applicationId, applicantId: context.applicantId },
        include: { paymentAttempts: true, appointment: { include: appointmentInclude } },
      });
      if (!application) throw apiErrors.notFound();
      if (!application.paymentAttempts.some((attempt) => attempt.status === "SUCCEEDED")) {
        throw apiErrors.appointmentNotEligible();
      }
      if (application.appointment?.status === "CONFIRMED") {
        if (application.appointment.slotId === input.slotId) return application.appointment;
        throw apiErrors.appointmentAlreadyBooked();
      }
      if (application.status !== "READY_FOR_APPOINTMENT") throw apiErrors.appointmentNotEligible();

      await database.$queryRaw(Prisma.sql`SELECT "id" FROM "AppointmentSlot" WHERE "id" = ${input.slotId}::uuid FOR UPDATE`);
      const slot = await database.appointmentSlot.findUnique({ where: { id: input.slotId }, include: { rto: true } });
      if (!slot) throw apiErrors.notFound();
      await database.$queryRaw(Prisma.sql`SELECT "id" FROM "Rto" WHERE "id" = ${slot.rtoId}::uuid FOR SHARE`);
      if (slot.serviceKey !== application.serviceKey) throw apiErrors.appointmentNotEligible();
      assertSlotBookable(slot, now);

      const capacity = await database.appointmentSlot.updateMany({
        where: { id: slot.id, bookedCount: { lt: slot.capacity }, releasedAt: { lte: now } },
        data: { bookedCount: { increment: 1 } },
      });
      if (capacity.count !== 1) throw apiErrors.appointmentUnavailable("CAPACITY_FULL");

      const appointment = application.appointment
        ? await database.appointment.update({
            where: { id: application.appointment.id },
            data: { slotId: slot.id, status: "CONFIRMED", bookedAt: now, cancelledAt: null },
            include: appointmentInclude,
          })
        : await database.appointment.create({
            data: { applicationId: application.id, applicantId: context.applicantId, slotId: slot.id, bookedAt: now },
            include: appointmentInclude,
          });
      await database.application.update({ where: { id: application.id }, data: { status: "APPOINTMENT_BOOKED" } });
      await database.applicationEvent.create({ data: {
        applicationId: application.id,
        actorApplicantId: context.applicantId,
        eventType: "APPOINTMENT_BOOKED",
        correlationId: input.correlationId,
        createdAt: now,
      } });
      await writeAppointmentAudit(database, {
        context, appointmentId: appointment.id, eventType: "APPOINTMENT_BOOKED",
        correlationId: input.correlationId, applicationId: application.id, slotId: slot.id,
      });
      return appointment;
    }, { isolationLevel: "Serializable" });
    return appointmentOutput(record);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && retryOnSerializationConflict) {
      return bookAppointment(context, input, databaseClient, false);
    }
    throw error;
  }
}

export async function listAppointments(
  context: AuthenticatedContext,
  databaseClient: PrismaClient = prisma,
): Promise<readonly Appointment[]> {
  const records = await databaseClient.appointment.findMany({
    where: { applicantId: context.applicantId },
    include: appointmentInclude,
    orderBy: [{ bookedAt: "desc" }, { id: "desc" }],
  });
  return appointmentListSchema.parse({ appointments: records.map(appointmentOutput) }).appointments;
}

export async function cancelAppointment(
  context: AuthenticatedContext,
  input: Readonly<{ appointmentId: string; correlationId: string; now?: Date }>,
  databaseClient: PrismaClient = prisma,
  retryOnSerializationConflict = true,
): Promise<Appointment> {
  const now = input.now ?? new Date();
  if (retryOnSerializationConflict) await enforceMutationRateLimit(context, "CANCEL", now, databaseClient);
  try {
    const record = await databaseClient.$transaction(async (database) => {
      const owned = await database.appointment.findFirst({ where: { id: input.appointmentId, applicantId: context.applicantId } });
      if (!owned) throw apiErrors.notFound();
      await database.$queryRaw(Prisma.sql`SELECT "id" FROM "Application" WHERE "id" = ${owned.applicationId}::uuid FOR UPDATE`);
      await database.$queryRaw(Prisma.sql`SELECT "id" FROM "Appointment" WHERE "id" = ${owned.id}::uuid FOR UPDATE`);
      const appointment = await database.appointment.findFirst({
        where: { id: owned.id, applicantId: context.applicantId }, include: appointmentInclude,
      });
      if (!appointment) throw apiErrors.notFound();
      if (appointment.status === "CANCELLED") return appointment;

      await database.$queryRaw(Prisma.sql`SELECT "id" FROM "AppointmentSlot" WHERE "id" = ${appointment.slotId}::uuid FOR UPDATE`);
      const released = await database.appointmentSlot.updateMany({
        where: { id: appointment.slotId, bookedCount: { gt: 0 } }, data: { bookedCount: { decrement: 1 } },
      });
      if (released.count !== 1) throw apiErrors.appointmentCapacityInvariant();

      const cancelled = await database.appointment.update({
        where: { id: appointment.id }, data: { status: "CANCELLED", cancelledAt: now }, include: appointmentInclude,
      });
      await database.application.update({ where: { id: appointment.applicationId }, data: { status: "READY_FOR_APPOINTMENT" } });
      await database.applicationEvent.create({ data: {
        applicationId: appointment.applicationId,
        actorApplicantId: context.applicantId,
        eventType: "APPOINTMENT_CANCELLED",
        correlationId: input.correlationId,
        createdAt: now,
      } });
      await writeAppointmentAudit(database, {
        context, appointmentId: appointment.id, eventType: "APPOINTMENT_CANCELLED",
        correlationId: input.correlationId, applicationId: appointment.applicationId, slotId: appointment.slotId,
      });
      return cancelled;
    }, { isolationLevel: "Serializable" });
    return appointmentOutput(record);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && retryOnSerializationConflict) {
      return cancelAppointment(context, input, databaseClient, false);
    }
    throw error;
  }
}

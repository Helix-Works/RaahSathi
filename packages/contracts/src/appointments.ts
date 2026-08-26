import { z } from "zod";

import { serviceKeySchema } from "@raahsathi/contracts/applications";

export const availabilityReasonCodeSchema = z.enum([
  "AVAILABLE",
  "CAPACITY_FULL",
  "SLOTS_NOT_RELEASED",
  "SLOT_ELAPSED",
  "CENTER_UNAVAILABLE",
  "BOOKING_SERVICE_UNAVAILABLE",
]);

export const monthParameterSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const appointmentDateSchema = z.iso.date();
export const appointmentTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const rtoSchema = z.object({
  id: z.uuid(),
  code: z.string().regex(/^SYNTHETIC_[A-Z_]{3,40}$/),
  nameEn: z.string().min(1).max(100),
  nameHi: z.string().min(1).max(100),
  district: z.string().min(1).max(80),
  status: availabilityReasonCodeSchema,
}).strict();

export const rtoListSchema = z.object({ rtos: z.array(rtoSchema) }).strict();

export const availabilityDaySchema = z.object({
  date: appointmentDateSchema,
  status: availabilityReasonCodeSchema,
  availableSlots: z.number().int().min(0),
}).strict();

export const monthAvailabilitySchema = z.object({
  rtoId: z.uuid(),
  serviceKey: serviceKeySchema,
  month: monthParameterSchema,
  days: z.array(availabilityDaySchema),
}).strict();

export const appointmentSlotSchema = z.object({
  slotId: z.uuid(),
  startTime: appointmentTimeSchema,
  endTime: appointmentTimeSchema,
  capacity: z.number().int().positive(),
  remaining: z.number().int().min(0),
  status: availabilityReasonCodeSchema,
}).strict();

export const daySlotsSchema = z.object({
  rtoId: z.uuid(),
  serviceKey: serviceKeySchema,
  date: appointmentDateSchema,
  status: availabilityReasonCodeSchema,
  slots: z.array(appointmentSlotSchema),
}).strict();

export const createAppointmentRequestSchema = z.object({
  applicationId: z.uuid(),
  slotId: z.uuid(),
}).strict();

export const appointmentSchema = z.object({
  id: z.uuid(),
  applicationId: z.uuid(),
  slotId: z.uuid(),
  serviceKey: serviceKeySchema,
  status: z.enum(["CONFIRMED", "CANCELLED"]),
  rto: rtoSchema,
  date: appointmentDateSchema,
  startTime: appointmentTimeSchema,
  endTime: appointmentTimeSchema,
  bookedAt: z.iso.datetime(),
  cancelledAt: z.iso.datetime().nullable(),
}).strict();

export const appointmentListSchema = z.object({
  appointments: z.array(appointmentSchema),
}).strict();

export type AvailabilityReasonCode = z.infer<typeof availabilityReasonCodeSchema>;
export type Rto = z.infer<typeof rtoSchema>;
export type MonthAvailability = z.infer<typeof monthAvailabilitySchema>;
export type DaySlots = z.infer<typeof daySlotsSchema>;
export type CreateAppointmentRequest = z.infer<typeof createAppointmentRequestSchema>;
export type Appointment = z.infer<typeof appointmentSchema>;

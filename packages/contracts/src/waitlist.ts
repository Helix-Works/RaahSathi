import { z } from "zod";

import { appointmentDateSchema, appointmentTimeSchema, rtoSchema } from "@raahsathi/contracts/appointments";
import { serviceKeySchema } from "@raahsathi/contracts/applications";

export const waitlistTimeBucketSchema = z.enum(["MORNING", "AFTERNOON"]);
export const waitlistStatusSchema = z.enum(["ACTIVE", "OFFERED", "LEFT", "FULFILLED"]);
export const slotOfferStatusSchema = z.enum(["ACTIVE", "ACCEPTED", "DECLINED", "EXPIRED"]);
export const vehicleClassSchema = z.enum(["LMV"]);

export const waitlistPreferencesSchema = z.object({
  rtoId: z.uuid(), acceptableDateFrom: appointmentDateSchema, acceptableDateTo: appointmentDateSchema,
  timeBuckets: z.array(waitlistTimeBucketSchema).min(1).max(2), vehicleClass: vehicleClassSchema,
}).strict().refine((value) => value.acceptableDateFrom <= value.acceptableDateTo, {
  path: ["acceptableDateTo"], message: "Date range must be ordered.",
});
export const joinWaitlistRequestSchema = z.object({
  applicationId: z.uuid(), rtoId: z.uuid(), acceptableDateFrom: appointmentDateSchema,
  acceptableDateTo: appointmentDateSchema, timeBuckets: z.array(waitlistTimeBucketSchema).min(1).max(2),
  vehicleClass: vehicleClassSchema,
}).strict().refine((value) => value.acceptableDateFrom <= value.acceptableDateTo, {
  path: ["acceptableDateTo"], message: "Date range must be ordered.",
});
export const updateWaitlistRequestSchema = waitlistPreferencesSchema;

export const slotOfferSchema = z.object({
  id: z.uuid(), status: slotOfferStatusSchema, offeredAt: z.iso.datetime(), expiresAt: z.iso.datetime(),
  slot: z.object({ id: z.uuid(), date: appointmentDateSchema, startTime: appointmentTimeSchema,
    endTime: appointmentTimeSchema, vehicleClass: vehicleClassSchema }).strict(),
}).strict();
export const waitlistEntrySchema = z.object({
  id: z.uuid(), applicationId: z.uuid(), serviceKey: serviceKeySchema, status: waitlistStatusSchema,
  vehicleClass: vehicleClassSchema, acceptableDateFrom: appointmentDateSchema, acceptableDateTo: appointmentDateSchema,
  timeBuckets: z.array(waitlistTimeBucketSchema).min(1), joinedAt: z.iso.datetime(),
  rto: rtoSchema, offer: slotOfferSchema.nullable(),
}).strict();
export const waitlistListSchema = z.object({ entries: z.array(waitlistEntrySchema) }).strict();

export type WaitlistTimeBucket = z.infer<typeof waitlistTimeBucketSchema>;
export type WaitlistPreferences = z.infer<typeof waitlistPreferencesSchema>;
export type JoinWaitlistRequest = z.infer<typeof joinWaitlistRequestSchema>;
export type WaitlistEntry = z.infer<typeof waitlistEntrySchema>;

import { z } from "zod";

export const serviceKeySchema = z.enum(["LEARNER_LICENCE", "PERMANENT_DRIVING_LICENCE"]);
export const applicationSectionOrder = ["PERSONAL_DETAILS", "ADDRESS", "SERVICE_DETAILS", "DECLARATION"] as const;
export const applicationSectionKeySchema = z.enum(applicationSectionOrder);
export const applicationStatusCodeSchema = z.enum(["DRAFT", "IN_PROGRESS", "READY_FOR_IDENTITY"]);
export const applicationNextActionCodeSchema = z.enum([
  "COMPLETE_PERSONAL_DETAILS", "COMPLETE_ADDRESS", "COMPLETE_SERVICE_DETAILS", "COMPLETE_DECLARATION", "VERIFY_IDENTITY",
]);
export const applicationBlockingReasonCodeSchema = z.enum(["IDENTITY_VERIFICATION_REQUIRED"]);

export const personalDetailsDataSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();
export const addressDataSchema = z.object({
  district: z.enum(["CENTRAL", "EAST", "NEW_DELHI", "NORTH", "NORTH_WEST", "SOUTH", "SOUTH_WEST", "WEST"]),
  postalCode: z.string().regex(/^11\d{4}$/),
}).strict();
export const serviceDetailsDataSchema = z.object({
  vehicleClass: z.literal("LMV"),
  learnerLicenceReference: z.string().trim().min(6).max(30).optional(),
}).strict();
export const declarationDataSchema = z.object({ accepted: z.literal(true) }).strict();

export const applicationSectionDataSchema = z.union([
  personalDetailsDataSchema, addressDataSchema, serviceDetailsDataSchema, declarationDataSchema,
]);

export const createApplicationRequestSchema = z.object({ serviceKey: serviceKeySchema }).strict();
export const saveApplicationSectionRequestSchema = z.object({
  expectedRevision: z.number().int().min(0),
  data: z.record(z.string(), z.unknown()),
}).strict();

export const applicationSectionSchema = z.object({
  sectionKey: applicationSectionKeySchema,
  data: applicationSectionDataSchema,
  revision: z.number().int().positive(),
  completed: z.boolean(),
  updatedAt: z.iso.datetime(),
}).strict();
export const applicationEventSchema = z.object({
  id: z.uuid(), eventType: z.enum(["APPLICATION_CREATED", "SECTION_SAVED", "SECTION_COMPLETED", "WORKFLOW_ADVANCED"]),
  sectionKey: applicationSectionKeySchema.optional(), createdAt: z.iso.datetime(),
}).strict();
export const applicationSummarySchema = z.object({
  id: z.uuid(), serviceKey: serviceKeySchema, statusCode: applicationStatusCodeSchema,
  progressPercent: z.number().int().min(0).max(100), nextActionCode: applicationNextActionCodeSchema,
  blockingReasonCode: applicationBlockingReasonCodeSchema.optional(), updatedAt: z.iso.datetime(),
}).strict();
export const applicationDetailSchema = applicationSummarySchema.extend({
  sections: z.array(applicationSectionSchema), history: z.array(applicationEventSchema),
}).strict();
export const applicationListSchema = z.object({ applications: z.array(applicationSummarySchema) }).strict();
export const serviceSummarySchema = z.object({ serviceKey: serviceKeySchema }).strict();
export const serviceListSchema = z.array(serviceSummarySchema).readonly();

export type ServiceKey = z.infer<typeof serviceKeySchema>;
export type ServiceSummary = z.infer<typeof serviceSummarySchema>;
export type ApplicationSectionKey = z.infer<typeof applicationSectionKeySchema>;
export type ApplicationSummary = z.infer<typeof applicationSummarySchema>;
export type ApplicationDetail = z.infer<typeof applicationDetailSchema>;

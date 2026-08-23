import { z } from "zod";

export const identityOutcomeSchema = z.enum([
  "VERIFIED", "OTP_INVALID", "USER_MISMATCH", "TIMEOUT", "PROVIDER_UNAVAILABLE", "RETRY_REQUIRED",
]);
export const documentKindSchema = z.enum(["SYNTHETIC_IDENTITY_PROOF", "SYNTHETIC_ADDRESS_PROOF"]);
export const documentRecordSchema = z.object({
  id: z.uuid(),
  kind: documentKindSchema,
  syntheticReference: z.string().regex(/^SYN-[A-Z0-9-]{8,40}$/),
  issuedAt: z.iso.datetime(),
}).strict();
export const identityAttemptSchema = z.object({
  id: z.uuid(),
  outcome: identityOutcomeSchema,
  attemptNumber: z.number().int().positive(),
  retryable: z.boolean(),
  createdAt: z.iso.datetime(),
}).strict();
export const identityContextSchema = z.object({
  attempt: identityAttemptSchema.nullable(),
  documents: z.array(documentRecordSchema),
}).strict();

export const licenceKindSchema = z.enum(["LEARNER"]);
export const vehicleClassSchema = z.enum(["LMV"]);
export const licenceRecordSchema = z.object({
  id: z.uuid(),
  kind: licenceKindSchema,
  syntheticReference: z.string().regex(/^SYN-LL-[A-Z0-9-]{8,40}$/),
  vehicleClass: vehicleClassSchema,
  issuedAt: z.iso.datetime(),
  validUntil: z.iso.datetime(),
}).strict();
export const licenceListSchema = z.object({ licences: z.array(licenceRecordSchema) }).strict();

export type IdentityOutcome = z.infer<typeof identityOutcomeSchema>;
export type IdentityAttemptSummary = z.infer<typeof identityAttemptSchema>;
export type IdentityContext = z.infer<typeof identityContextSchema>;
export type LicenceRecordSummary = z.infer<typeof licenceRecordSchema>;

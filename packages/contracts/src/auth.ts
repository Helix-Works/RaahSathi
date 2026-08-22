import { z } from "zod";

export const preferredLocaleSchema = z.enum(["en", "hi"]);

export const requestOtpRequestSchema = z.strictObject({
  mobileNumber: z.string().regex(/^[6-9][0-9]{9}$/),
});

export const otpChallengeSchema = z.strictObject({
  challengeId: z.uuid(),
  maskedDestination: z.string().regex(/^.{6}[0-9]{4}$/u),
  expiresAt: z.iso.datetime({ offset: true }),
  resendAvailableAt: z.iso.datetime({ offset: true }),
});

export const verifyOtpRequestSchema = z.strictObject({
  challengeId: z.uuid(),
  otp: z.string().regex(/^[0-9]{6}$/),
  preferredLocale: preferredLocaleSchema,
});

export const currentUserSchema = z.strictObject({
  id: z.uuid(),
  displayName: z.string().min(1).max(120),
  preferredLocale: preferredLocaleSchema,
});

export const sessionSummarySchema = z.strictObject({
  user: currentUserSchema,
});

export type RequestOtpInput = z.infer<typeof requestOtpRequestSchema>;
export type OtpChallenge = z.infer<typeof otpChallengeSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpRequestSchema>;
export type CurrentUser = z.infer<typeof currentUserSchema>;
export type SessionSummary = z.infer<typeof sessionSummarySchema>;

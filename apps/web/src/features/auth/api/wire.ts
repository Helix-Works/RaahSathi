import { z } from "zod";

const currentUserSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  preferredLocale: z.enum(["en", "hi"]),
});

export const otpChallengeSchema = z.object({
  challengeId: z.string().min(1),
  maskedDestination: z.string().min(1),
});

export const sessionSummarySchema = z.object({
  user: currentUserSchema,
});

import { z } from "zod";

export const healthResponseSchema = z.strictObject({ status: z.literal("ok") });
export const readinessResponseSchema = z.strictObject({
  status: z.literal("ready"),
  database: z.literal("up"),
});
export const apiErrorSchema = z.strictObject({
  error: z.strictObject({
    code: z.string(),
    messageKey: z.string(),
    correlationId: z.string(),
  }),
});

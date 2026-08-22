import { z } from "zod";

export const serviceSummariesSchema = z
  .array(
    z
      .object({
        serviceKey: z.enum(["LEARNER_LICENCE", "PERMANENT_DRIVING_LICENCE"]),
      })
      .strict(),
  )
  .readonly();

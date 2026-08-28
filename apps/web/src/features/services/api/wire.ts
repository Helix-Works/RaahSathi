import { z } from "zod";
import { serviceSummarySchema } from "@raahsathi/contracts/applications";

export const serviceSummariesSchema = z
  .array(serviceSummarySchema)
  .readonly();

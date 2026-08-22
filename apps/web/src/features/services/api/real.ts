import type { ServiceSummary } from "@raahsathi/contracts";

import { apiRequest, createInvalidResponseError } from "@/lib/api";

import { serviceSummariesSchema } from "./wire";

export async function getRealServices(): Promise<readonly ServiceSummary[]> {
  const payload = await apiRequest("/services", {
    cache: "no-store",
  });

  const result = serviceSummariesSchema.safeParse(payload);

  if (!result.success) {
    throw createInvalidResponseError(200);
  }

  return result.data;
}

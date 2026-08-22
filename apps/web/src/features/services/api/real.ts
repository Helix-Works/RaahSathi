import type { ServiceSummary } from "@raahsathi/contracts";

import { apiRequest } from "@/lib/api";

export function getRealServices(): Promise<readonly ServiceSummary[]> {
  return apiRequest<readonly ServiceSummary[]>("/services", {
    cache: "no-store",
  });
}

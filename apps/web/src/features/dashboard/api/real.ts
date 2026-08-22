import { ApiClientError } from "@/lib/api";

import type { DashboardSummary } from "@/features/dashboard/types";

export async function getRealDashboardSummary(): Promise<DashboardSummary> {
  throw new ApiClientError({
    status: 503,
    code: "DASHBOARD_CONTRACT_PENDING",
    messageKey: "errors.requestFailed",
    retryable: false,
  });
}

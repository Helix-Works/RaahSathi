import { ApiClientError } from "@/lib/api";

import type { MockSessionScenario } from "@/features/auth/types";
import type { DashboardSummary } from "@/features/dashboard/types";

export async function getRealDashboardSummary(
  scenario: Exclude<MockSessionScenario, "expired">,
): Promise<DashboardSummary> {
  void scenario;
  throw new ApiClientError({
    status: 503,
    code: "DASHBOARD_CONTRACT_PENDING",
    messageKey: "errors.requestFailed",
    retryable: false,
  });
}

import type { MockSessionScenario } from "@/features/auth/types";
import { readMockDashboardScenario } from "@/features/auth/api/mock-session";
import type { DashboardSummary } from "@/features/dashboard/types";
import { ApiClientError } from "@/lib/api";
import {
  activeDashboardFixture,
  appointmentDashboardFixture,
  emptyDashboardFixture,
} from "@/mocks/fixtures/dashboard";

export async function getMockDashboardSummary(): Promise<DashboardSummary> {
  const scenario: Exclude<MockSessionScenario, "expired"> | undefined =
    await readMockDashboardScenario();

  if (!scenario) {
    throw new ApiClientError({
      status: 401,
      code: "MOCK_SESSION_REQUIRED",
      messageKey: "errors.requestFailed",
      retryable: false,
    });
  }

  switch (scenario) {
    case "active":
      return activeDashboardFixture;
    case "empty":
      return emptyDashboardFixture;
    case "appointment":
      return appointmentDashboardFixture;
  }
}

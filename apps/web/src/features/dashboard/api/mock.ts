import type { MockSessionScenario } from "@/features/auth/types";
import type { DashboardSummary } from "@/features/dashboard/types";
import {
  activeDashboardFixture,
  appointmentDashboardFixture,
  emptyDashboardFixture,
} from "@/mocks/fixtures/dashboard";

export async function getMockDashboardSummary(
  scenario: Exclude<MockSessionScenario, "expired">,
): Promise<DashboardSummary> {
  switch (scenario) {
    case "active":
      return activeDashboardFixture;
    case "empty":
      return emptyDashboardFixture;
    case "appointment":
      return appointmentDashboardFixture;
  }
}

import { describe, expect, it } from "vitest";

import { selectHeroApplication } from "@/features/dashboard/dashboard-presentation";
import { activeDashboardFixture, emptyDashboardFixture } from "@/mocks/fixtures/dashboard";

describe("personalized dashboard summary", () => {
  it("keeps every resumable application while prioritizing the offered slot", () => {
    expect(activeDashboardFixture.applications).toHaveLength(2);
    expect(selectHeroApplication(activeDashboardFixture.applications)?.statusCode).toBe("SLOT_OFFERED");
    expect(activeDashboardFixture.services.map(({ serviceKey }) => serviceKey)).toEqual([
      "LEARNER_LICENCE",
      "PERMANENT_DRIVING_LICENCE",
    ]);
  });

  it("keeps an untouched account empty while retaining available services", () => {
    expect(emptyDashboardFixture.applications).toEqual([]);
    expect(emptyDashboardFixture.appointments).toEqual([]);
    expect(emptyDashboardFixture.waitlistEntries).toEqual([]);
    expect(emptyDashboardFixture.offers).toEqual([]);
    expect(emptyDashboardFixture.licences).toEqual([]);
    expect(emptyDashboardFixture.services).toHaveLength(2);
  });
});

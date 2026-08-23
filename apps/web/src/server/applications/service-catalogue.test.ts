import { describe, expect, it } from "vitest";

import { listAvailableServices } from "./service-catalogue";

describe("server service catalogue", () => {
  it("returns the authoritative Phase 3 service list without HTTP fetching", () => {
    expect(listAvailableServices()).toEqual([
      { serviceKey: "LEARNER_LICENCE" },
      { serviceKey: "PERMANENT_DRIVING_LICENCE" },
    ]);
  });
});

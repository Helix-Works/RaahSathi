import { describe, expect, it } from "vitest";

import { listAvailableServices } from "./service-catalogue";

describe("server service catalogue", () => {
  it("returns all four authoritative Phase 8 services without HTTP fetching", () => {
    expect(listAvailableServices()).toEqual([
      { serviceKey: "LEARNER_LICENCE" },
      { serviceKey: "PERMANENT_DRIVING_LICENCE" },
      { serviceKey: "DRIVING_LICENCE_RENEWAL" },
      { serviceKey: "DRIVING_LICENCE_ADDRESS_CHANGE" },
    ]);
  });
});

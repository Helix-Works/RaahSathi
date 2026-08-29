import { describe, expect, it } from "vitest";

import { serviceSummariesSchema } from "./wire";

describe("service catalogue wire schema", () => {
  it("accepts every service exposed by the API contract", () => {
    expect(serviceSummariesSchema.parse([
      { serviceKey: "LEARNER_LICENCE" },
      { serviceKey: "PERMANENT_DRIVING_LICENCE" },
      { serviceKey: "DRIVING_LICENCE_RENEWAL" },
      { serviceKey: "DRIVING_LICENCE_ADDRESS_CHANGE" },
    ])).toHaveLength(4);
  });
});

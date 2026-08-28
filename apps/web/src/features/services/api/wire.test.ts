import { describe, expect, it } from "vitest";

import { serviceSummariesSchema } from "./wire";

describe("service summaries wire contract", () => {
  it("accepts every implemented service", () => {
    expect(serviceSummariesSchema.parse([
      { serviceKey: "LEARNER_LICENCE" },
      { serviceKey: "PERMANENT_DRIVING_LICENCE" },
      { serviceKey: "DRIVING_LICENCE_RENEWAL" },
      { serviceKey: "DRIVING_LICENCE_ADDRESS_CHANGE" },
    ])).toHaveLength(4);
  });
});

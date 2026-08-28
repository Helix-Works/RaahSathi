import { describe, expect, it } from "vitest";

import { displayReference } from "@/lib/display-reference";

describe("displayReference", () => {
  it("keeps wire values internal while presenting a RaahSathi reference", () => {
    expect(displayReference("SYN-LL-00000001")).toBe("RS-LL-00000001");
    expect(displayReference("PUBLIC-0001")).toBe("PUBLIC-0001");
  });
});

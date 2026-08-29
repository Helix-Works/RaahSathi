import { describe, expect, it } from "vitest";

import { displayApplicationReference, displayReference } from "@/lib/display-reference";

describe("displayReference", () => {
  it("keeps wire values internal while presenting a RaahSathi reference", () => {
    expect(displayReference("SYN-LL-00000001")).toBe("RS-LL-00000001");
    expect(displayReference("PUBLIC-0001")).toBe("PUBLIC-0001");
  });

  it("keeps enough of an application ID to distinguish citizen-facing references", () => {
    expect(displayApplicationReference("a0000000-0000-4000-8000-000000000001")).toBe("RS-000000000001");
    expect(displayApplicationReference("a0000000-0000-4000-8000-000000000002")).toBe("RS-000000000002");
  });
});

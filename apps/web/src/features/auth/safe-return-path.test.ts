import { describe, expect, it } from "vitest";

import { getSafeReturnPath } from "./safe-return-path";

describe("safe authentication return paths", () => {
  it("accepts the application list and UUID-constrained detail routes", () => {
    expect(getSafeReturnPath("/applications")).toBe("/applications");
    expect(getSafeReturnPath("/applications/30000000-0000-4000-8000-000000000001"))
      .toBe("/applications/30000000-0000-4000-8000-000000000001");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "javascript:alert(1)",
    "data:text/html,unsafe",
    "/applications/not-a-uuid",
    "/applications/30000000-0000-4000-8000-000000000001/extra",
    "/applications/30000000-0000-4000-8000-000000000001?token=secret",
    "/applications//30000000-0000-4000-8000-000000000001",
  ])("rejects unsafe or malformed return path %s", (value) => {
    expect(getSafeReturnPath(value)).toBe("/dashboard");
  });
});


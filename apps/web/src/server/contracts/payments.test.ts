import { describe, expect, it } from "vitest";

import { paymentProviderSignatureHeaderSchema } from "./payments";

describe("payment provider signature contract", () => {
  it("accepts the exact lowercase HMAC-SHA-256 header shape", () => {
    expect(paymentProviderSignatureHeaderSchema.safeParse(`sha256=${"a".repeat(64)}`).success).toBe(true);
  });

  it.each([
    "sha256=",
    "sha256=not-hexadecimal",
    `sha256=${"A".repeat(64)}`,
    `sha256=${"a".repeat(63)}`,
    `sha256=${"a".repeat(65)}`,
  ])("rejects malformed signature %s", (signature) => {
    expect(paymentProviderSignatureHeaderSchema.safeParse(signature).success).toBe(false);
  });
});

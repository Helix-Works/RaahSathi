import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { isIdentityConcurrencyConflict, isRetryableIdentityOutcome, providerOutcomeForAttempt } from "./identity-service";

describe("synthetic identity provider policy", () => {
  it("models every required deterministic first-attempt outcome", () => {
    expect(providerOutcomeForAttempt("SUCCESS", 1)).toBe("VERIFIED");
    expect(providerOutcomeForAttempt("OTP_INVALID", 1)).toBe("OTP_INVALID");
    expect(providerOutcomeForAttempt("USER_MISMATCH", 1)).toBe("USER_MISMATCH");
    expect(providerOutcomeForAttempt("TIMEOUT", 1)).toBe("TIMEOUT");
    expect(providerOutcomeForAttempt("PROVIDER_UNAVAILABLE", 1)).toBe("PROVIDER_UNAVAILABLE");
    expect(providerOutcomeForAttempt("RETRY_REQUIRED", 1)).toBe("RETRY_REQUIRED");
  });

  it("allows recoverable outcomes to converge on retry without treating mismatch as retryable", () => {
    expect(providerOutcomeForAttempt("PROVIDER_UNAVAILABLE", 2)).toBe("VERIFIED");
    expect(providerOutcomeForAttempt("TIMEOUT", 2)).toBe("VERIFIED");
    expect(providerOutcomeForAttempt("USER_MISMATCH", 2)).toBe("USER_MISMATCH");
    expect(isRetryableIdentityOutcome("PROVIDER_UNAVAILABLE")).toBe(true);
    expect(isRetryableIdentityOutcome("USER_MISMATCH")).toBe(false);
    expect(isRetryableIdentityOutcome("VERIFIED")).toBe(false);
  });

  it("recognizes only Prisma transaction and uniqueness conflicts as recoverable concurrency failures", () => {
    const prismaError = (code: string) => new Prisma.PrismaClientKnownRequestError("conflict", {
      code,
      clientVersion: Prisma.prismaVersion.client,
    });
    expect(isIdentityConcurrencyConflict(prismaError("P2034"))).toBe(true);
    expect(isIdentityConcurrencyConflict(prismaError("P2002"))).toBe(true);
    expect(isIdentityConcurrencyConflict(prismaError("P2025"))).toBe(false);
    expect(isIdentityConcurrencyConflict(new Error("conflict"))).toBe(false);
  });
});

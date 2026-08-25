import { Prisma, type PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  getIdentityContext,
  isIdentityConcurrencyConflict,
  isRetryableIdentityOutcome,
  providerOutcomeForAttempt,
} from "./identity-service";

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

  it("recognizes Prisma transaction, uniqueness, and raw PostgreSQL serialization conflicts", () => {
    const prismaError = (code: string, meta?: Record<string, unknown>) => new Prisma.PrismaClientKnownRequestError("conflict", {
      code,
      clientVersion: Prisma.prismaVersion.client,
      meta,
    });
    expect(isIdentityConcurrencyConflict(prismaError("P2002"))).toBe(true);
    expect(isIdentityConcurrencyConflict(prismaError("P2034"))).toBe(true);
    expect(isIdentityConcurrencyConflict(prismaError("P2010", {
      code: "40001",
      message: "could not serialize access due to concurrent update",
    }))).toBe(true);
  });

  it("does not classify unrelated Prisma or raw-query failures as identity concurrency conflicts", () => {
    const prismaError = (code: string, meta?: Record<string, unknown>) => new Prisma.PrismaClientKnownRequestError("database failure", {
      code,
      clientVersion: Prisma.prismaVersion.client,
      meta,
    });

    expect(isIdentityConcurrencyConflict(prismaError("P2025"))).toBe(false);
    expect(isIdentityConcurrencyConflict(prismaError("P2010", {
      code: "23505",
      message: "duplicate key value violates unique constraint",
    }))).toBe(false);
    expect(isIdentityConcurrencyConflict(prismaError("P2010", {
      code: "42601",
      message: "syntax error",
    }))).toBe(false);
    expect(isIdentityConcurrencyConflict(prismaError("P2010"))).toBe(false);
    expect(isIdentityConcurrencyConflict(new Error("conflict"))).toBe(false);
  });

  it("retries identity reconstruction once after P1017", async () => {
    let executions = 0;
    const database = {
      application: {
        findFirst: async () => {
          executions += 1;
          if (executions === 1) {
            throw new Prisma.PrismaClientKnownRequestError("Server has closed the connection.", {
              code: "P1017",
              clientVersion: Prisma.prismaVersion.client,
            });
          }
          return { documents: [], identityAttempts: [] };
        },
      },
    } as unknown as PrismaClient;

    await expect(getIdentityContext(
      { sessionId: crypto.randomUUID(), applicantId: crypto.randomUUID() },
      crypto.randomUUID(),
      database,
    )).resolves.toEqual({ attempt: null, documents: [] });
    expect(executions).toBe(2);
  });
});

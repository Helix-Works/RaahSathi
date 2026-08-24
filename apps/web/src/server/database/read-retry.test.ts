import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  isRetryableTransactionConflict,
  isTransientConnectionClosedError,
} from "./prisma-errors";
import { retryTransientConnectionRead } from "./read-retry";

function prismaError(code: string, meta?: Record<string, unknown>): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("database failure", {
    code,
    clientVersion: Prisma.prismaVersion.client,
    meta,
  });
}

describe("transient connection read recovery", () => {
  it("classifies only Prisma P1017 as a transient closed connection", () => {
    expect(isTransientConnectionClosedError(prismaError("P1017"))).toBe(true);
    expect(isTransientConnectionClosedError(prismaError("P2024"))).toBe(false);
    expect(isTransientConnectionClosedError(prismaError("P2034"))).toBe(false);
    expect(isTransientConnectionClosedError(prismaError("P2010", { code: "40001" }))).toBe(false);
    expect(isTransientConnectionClosedError(new Error("Server has closed the connection."))).toBe(false);
  });

  it("keeps transaction conflicts separate from closed-connection errors", () => {
    expect(isRetryableTransactionConflict(prismaError("P2034"))).toBe(true);
    expect(isRetryableTransactionConflict(prismaError("P2010", { code: "40001" }))).toBe(true);
    expect(isRetryableTransactionConflict(prismaError("P1017"))).toBe(false);
  });

  it("retries one P1017 failure once and returns the successful read", async () => {
    const read = vi.fn()
      .mockRejectedValueOnce(prismaError("P1017"))
      .mockResolvedValueOnce("persisted value");

    await expect(retryTransientConnectionRead(read)).resolves.toBe("persisted value");
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("rethrows the second P1017 failure after exactly two executions", async () => {
    const secondError = prismaError("P1017");
    const read = vi.fn()
      .mockRejectedValueOnce(prismaError("P1017"))
      .mockRejectedValueOnce(secondError);

    await expect(retryTransientConnectionRead(read)).rejects.toBe(secondError);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("rethrows a non-P1017 failure without retrying", async () => {
    const poolTimeout = prismaError("P2024");
    const read = vi.fn().mockRejectedValue(poolTimeout);

    await expect(retryTransientConnectionRead(read)).rejects.toBe(poolTimeout);
    expect(read).toHaveBeenCalledTimes(1);
  });
});

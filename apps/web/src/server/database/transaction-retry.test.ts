import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { retryTransactionConflict } from "./transaction-retry";

function prismaError(code: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError("Synthetic Prisma failure", {
    code,
    clientVersion: "6.19.3",
    meta,
  });
}

describe("retryTransactionConflict", () => {
  it.each([
    prismaError("P2034"),
    prismaError("P2010", { code: "40001" }),
  ])("retries a complete operation for a classified transaction conflict", async (error) => {
    const operation = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce("persisted");

    await expect(retryTransactionConflict(operation)).resolves.toBe("persisted");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("stops after the bounded retry limit", async () => {
    const operation = vi.fn().mockRejectedValue(prismaError("P2034"));

    await expect(retryTransactionConflict(operation)).rejects.toMatchObject({ code: "P2034" });
    expect(operation).toHaveBeenCalledTimes(4);
  });

  it.each([
    prismaError("P2010", { code: "42P01" }),
    prismaError("P2028"),
    prismaError("P1017"),
    new Error("unrelated"),
  ])("does not retry an unrelated failure", async (error) => {
    const operation = vi.fn().mockRejectedValue(error);

    await expect(retryTransactionConflict(operation)).rejects.toBe(error);
    expect(operation).toHaveBeenCalledOnce();
  });
});

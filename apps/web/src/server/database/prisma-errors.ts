import "server-only";

import { Prisma } from "@prisma/client";

export function isTransientConnectionClosedError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === "P1017";
}

export function isRetryableTransactionConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;

  return error.code === "P2034"
    || (error.code === "P2010" && error.meta?.code === "40001");
}

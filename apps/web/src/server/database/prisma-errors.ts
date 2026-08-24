import "server-only";

import { Prisma } from "@prisma/client";

export function isRetryableTransactionConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;

  return error.code === "P2034"
    || (error.code === "P2010" && error.meta?.code === "40001");
}

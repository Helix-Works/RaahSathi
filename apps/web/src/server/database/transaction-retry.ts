import "server-only";

import { isRetryableTransactionConflict } from "./prisma-errors";

const transactionConflictRetryLimit = 1;

export async function retryTransactionConflict<Result>(
  operation: () => Promise<Result>,
  retriesRemaining = transactionConflictRetryLimit,
): Promise<Result> {
  try {
    return await operation();
  } catch (error) {
    if (retriesRemaining <= 0 || !isRetryableTransactionConflict(error)) {
      throw error;
    }

    return retryTransactionConflict(operation, retriesRemaining - 1);
  }
}

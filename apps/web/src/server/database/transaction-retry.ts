import "server-only";

import { isRetryableTransactionConflict } from "./prisma-errors";

const transactionConflictRetryLimit = 3;

function retryDelay(attempt: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 25 * 2 ** attempt));
}

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

    await retryDelay(transactionConflictRetryLimit - retriesRemaining);
    return retryTransactionConflict(operation, retriesRemaining - 1);
  }
}

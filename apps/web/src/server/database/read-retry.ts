import "server-only";

import { isTransientConnectionClosedError } from "./prisma-errors";

export async function retryTransientConnectionRead<Result>(
  read: () => Promise<Result>,
): Promise<Result> {
  try {
    return await read();
  } catch (error) {
    if (!isTransientConnectionClosedError(error)) throw error;
    return read();
  }
}

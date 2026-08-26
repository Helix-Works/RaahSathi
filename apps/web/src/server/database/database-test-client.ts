import { PrismaClient } from "@prisma/client";

const databaseTestTransactionTimeoutMs = 30_000;

export function databaseTestConnectionUrl(value: string | undefined): string {
  if (!value) throw new Error("A disposable database URL is required for database tests.");
  const url = new URL(value);
  if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "15");
  if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "15");
  if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "5");
  return url.toString();
}

export function createDatabaseTestClient(databaseUrl: string | undefined): PrismaClient {
  return new PrismaClient({
    datasourceUrl: databaseTestConnectionUrl(databaseUrl),
    transactionOptions: {
      maxWait: databaseTestTransactionTimeoutMs,
      timeout: databaseTestTransactionTimeoutMs,
    },
  });
}

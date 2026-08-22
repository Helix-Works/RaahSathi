export const disposableDatabaseConfirmation = "I_UNDERSTAND_THIS_DATABASE_WILL_BE_MUTATED";

export function databaseIdentity(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || url.pathname.length <= 1) return undefined;
    const port = url.port || "5432";
    return `${url.hostname.toLowerCase()}:${port}${decodeURIComponent(url.pathname)}`;
  } catch {
    return undefined;
  }
}

export function isDisposableDatabaseApproved(input: Readonly<{
  testDatabaseUrl: string | undefined;
  primaryDatabaseUrl: string | undefined;
  confirmation: string | undefined;
}>): boolean {
  const testIdentity = databaseIdentity(input.testDatabaseUrl);
  const primaryIdentity = databaseIdentity(input.primaryDatabaseUrl);
  return input.confirmation === disposableDatabaseConfirmation
    && testIdentity !== undefined
    && testIdentity !== primaryIdentity;
}

export type Phase7HeroCommandEnvironment = Readonly<{
  NODE_ENV?: string;
  VERCEL_ENV?: string;
}>;

/**
 * These commands intentionally mutate deterministic demo records. They are
 * rehearsal tooling, never a production operation, even when the data is
 * synthetic. Keep the guard at the CLI boundary so database tests can invoke
 * the fixture functions against their separately approved disposable database.
 */
export function assertPhase7HeroCommandEnvironment(
  environment: Phase7HeroCommandEnvironment = process.env,
): void {
  if (environment.NODE_ENV === "production" || environment.VERCEL_ENV === "production") {
    throw new Error("Phase 7 hero fixture commands are disabled in production-like environments.");
  }
}

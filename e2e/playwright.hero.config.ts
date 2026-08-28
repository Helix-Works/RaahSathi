import { defineConfig, devices } from "@playwright/test";

import { isDisposableDatabaseApproved } from "../apps/web/src/server/auth/database-test-safety";

const heroConfirmation = "RESET_PHASE7_HERO_SYNTHETIC_RECORDS";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the Phase 7 hero E2E gate.`);
  return value;
}

const testDatabaseUrl = required("TEST_DATABASE_URL");
const primaryDatabaseUrl = required("DATABASE_URL");
const disposableApproved = isDisposableDatabaseApproved({
  testDatabaseUrl,
  primaryDatabaseUrl,
  confirmation: process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION,
});
if (!disposableApproved) throw new Error("The hero E2E database identity is not an approved disposable database.");
if (process.env.RAAHSATHI_DEMO_RESET_CONFIRMATION !== heroConfirmation) {
  throw new Error("RAAHSATHI_DEMO_RESET_CONFIRMATION does not approve the enumerated hero reset.");
}

const port = process.env.E2E_HERO_PORT ?? "3207";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: "phase7-hero-journey.spec.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  timeout: 420_000,
  reporter: [["list"], ["html", { outputFolder: "playwright-report-hero", open: "never" }]],
  use: {
    baseURL,
    ...devices["Pixel 7"],
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `corepack pnpm --filter @raahsathi/web build && corepack pnpm --filter @raahsathi/web exec next start -p ${port}`,
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
      DIRECT_URL: testDatabaseUrl,
      NEXT_PUBLIC_DATA_SOURCE: "real",
    },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});

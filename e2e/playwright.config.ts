import { defineConfig, devices } from "@playwright/test";

const port = process.env.E2E_PORT ?? "3000";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests",
  testIgnore: "phase7-hero-journey.spec.ts",
  // Next.js development Server Actions intermittently close response streams under
  // multi-worker compilation; serial execution keeps the documented local gate deterministic.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: `corepack pnpm --filter @raahsathi/web exec next dev -p ${port}`,
    env: {
      NEXT_PUBLIC_DATA_SOURCE: process.env.E2E_DATA_SOURCE ?? "mock",
      NEXT_DIST_DIR: ".next-e2e",
    },
    url: baseURL,
    reuseExistingServer: process.env.E2E_REUSE_EXISTING_SERVER === "true",
    timeout: 120_000,
  },
});

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { expect, test, type Page } from "@playwright/test";

const waitlistApplicationId = "30000000-0000-4000-8000-000000000003";
const demoOtp = process.env.E2E_DEMO_OTP;
const realWaitlistEnabled = process.env.E2E_DATA_SOURCE === "real"
  && process.env.E2E_PHASE6_RELEASE === "true"
  && Boolean(demoOtp);
const repositoryRoot = resolve(process.cwd(), "..");

function fixtureSlotDate(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function login(page: Page) {
  await page.goto(`/login?returnTo=/applications/${waitlistApplicationId}`);
  await page.getByLabel("Synthetic mobile number").fill("9000000004");
  await page.getByRole("button", { name: "Send synthetic OTP" }).click();
  await page.getByLabel("One-time password").fill(demoOtp ?? "");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page).toHaveURL(new RegExp(`/applications/${waitlistApplicationId}$`));
}

function releaseFixtureSlot() {
  const executable = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const result = spawnSync(executable, ["--filter", "@raahsathi/web", "prisma:seed:phase6-release"], {
    cwd: repositoryRoot,
    env: process.env,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error("The approved Phase 6 release command failed.");
}

test.describe("real deterministic waitlist and slot-offer journey", () => {
  test.skip(!realWaitlistEnabled, "Set E2E_DATA_SOURCE=real, E2E_DEMO_OTP, and E2E_PHASE6_RELEASE=true to run the seeded Neon journey.");

  test("joins, receives, accepts, and reconstructs the offer-backed appointment", async ({ page }, testInfo) => {
    await login(page);
    const confirmed = page.getByText("Appointment confirmed", { exact: true });

    if (!(await confirmed.isVisible())) {
      const waiting = page.getByText("Waiting for a suitable appointment slot", { exact: true });
      const offer = page.getByText("Temporary appointment offer", { exact: true });

      if (!(await waiting.isVisible()) && !(await offer.isVisible())) {
        const date = fixtureSlotDate();
        await page.getByLabel("Preferred RTO").selectOption({ label: "Synthetic Rohini Demo RTO" });
        await page.getByLabel("Earliest acceptable date").fill(date);
        await page.getByLabel("Latest acceptable date").fill(date);
        await page.getByRole("button", { name: "Join waitlist" }).click();
        await expect(waiting).toBeVisible();
      }

      if (!(await offer.isVisible())) {
        releaseFixtureSlot();
        await page.getByRole("button", { name: "Refresh waitlist status" }).click();
        await expect(offer).toBeVisible();
      }

      await expect(page.getByText("09:00–09:30", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Accept offer" }).click();
      await expect(confirmed).toBeVisible();
    }

    await page.reload();
    await expect(confirmed).toBeVisible();
    if (testInfo.project.name === "mobile-chromium") {
      await page.getByRole("button", { name: "Open menu" }).click();
    }
    await page.getByRole("button", { name: "Log out" }).click();
    await login(page);
    await expect(confirmed).toBeVisible();
  });
});

import { expect, test, type Page } from "@playwright/test";

async function selectHindi(page: Page) {
  await page.goto("/");
  await page.context().addCookies([{ name: "raahsathi_locale", value: "hi", url: page.url() }]);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
}

async function completeMockLogin(page: Page, otp: string) {
  await page.goto("/login");
  await page.getByLabel("Mobile number").fill("9000000000");
  await page.getByRole("button", { name: "Send OTP" }).click();
  await page.getByLabel("One-time password").fill(otp);
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function expectStableScreenshot(page: Page, name: string) {
  await expect(page).toHaveScreenshot(name, {
    animations: "disabled",
    caret: "initial",
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
}

test.describe("curated visual regression baseline", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Desktop Chromium is the stable visual baseline.");
  });

  test("landing page in English at desktop width", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectStableScreenshot(page, "landing-en-desktop.png");
  });

  test("landing page in English at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectStableScreenshot(page, "landing-en-mobile.png");
  });

  test("landing page in Hindi at desktop width", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await selectHindi(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectStableScreenshot(page, "landing-hi-desktop.png");
  });

  test("landing page in Hindi at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await selectHindi(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectStableScreenshot(page, "landing-hi-mobile.png");
  });

  test("login presentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectStableScreenshot(page, "login-en-desktop.png");
  });

  test("services presentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/services");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectStableScreenshot(page, "services-en-desktop.png");
  });

  test("dashboard active-state presentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await completeMockLogin(page, "123456");
    await expect(page.getByRole("heading", { name: "Review temporary slot offer" })).toBeVisible();
    await expectStableScreenshot(page, "dashboard-active-en-desktop.png");
  });

  test("dashboard confirmed-appointment presentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await completeMockLogin(page, "333222");
    await expect(page.getByRole("heading", { name: "Upcoming appointment" })).toBeVisible();
    await expectStableScreenshot(page, "dashboard-appointment-en-desktop.png");
  });
});

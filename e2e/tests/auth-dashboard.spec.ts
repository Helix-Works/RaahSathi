import { expect, test, type Page } from "@playwright/test";

async function requestOtp(page: Page, mobileNumber = "9000000000") {
  await page.getByLabel("Synthetic mobile number").fill(mobileNumber);
  await page.getByRole("button", { name: "Send synthetic OTP" }).click();
}

async function completeMockLogin(page: Page, otp: string) {
  await page.goto("/login");
  await requestOtp(page);
  await expect(page.getByRole("heading", { name: "Synthetic OTP sent" })).toBeVisible();
  await page.getByLabel("One-time password").fill(otp);
  await page.getByRole("button", { name: "Verify and continue" }).click();
}

test("login page presents the English synthetic OTP request form", async ({ page }) => {
  await page.goto("/login");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Continue with a one-time password",
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Synthetic mobile number")).toBeVisible();
  await expect(page.getByText(/Do not enter your real mobile number/)).toBeVisible();
});

test("login page switches completely to Hindi", async ({ page }) => {
  await page.goto("/login");
  await page
    .getByRole("group", { name: "Choose language" })
    .getByRole("button", { name: "हिंदी" })
    .click();

  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await expect(
    page.getByRole("heading", { level: 1, name: "वन-टाइम पासवर्ड से आगे बढ़ें" }),
  ).toBeVisible();
  await expect(page.getByLabel("कृत्रिम मोबाइल नंबर")).toBeVisible();
  await expect(page.getByRole("button", { name: "कृत्रिम ओटीपी भेजें" })).toBeVisible();
});

test("OTP request reaches the deterministic sent state", async ({ page }) => {
  await page.goto("/login");
  await requestOtp(page);

  await expect(page.getByRole("heading", { name: "Synthetic OTP sent" })).toBeVisible();
  await expect(page.getByText(/••••••0000/)).toBeVisible();
  await expect(page.getByLabel("One-time password")).toBeFocused();
});

test("OTP verification presents invalid and expired states safely", async ({ page }) => {
  await page.goto("/login");
  await requestOtp(page);

  const otp = page.getByLabel("One-time password");
  await otp.fill("111111");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page.getByText(/synthetic OTP is not valid/)).toBeVisible();

  await otp.fill("222222");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page.getByText(/synthetic OTP has expired/)).toBeVisible();
});

test("request rate-limit and provider-unavailable states are distinct", async ({ page }) => {
  await page.goto("/login");
  await requestOtp(page, "9000000001");
  await expect(page.getByText(/Too many requests were made/)).toBeVisible();

  await page.getByLabel("Synthetic mobile number").fill("9000000002");
  await page.getByRole("button", { name: "Send synthetic OTP" }).click();
  await expect(page.getByText(/simulated OTP provider is temporarily unavailable/)).toBeVisible();
});

test("successful mock login shows active work, blocking reason, and next action", async ({
  page,
}) => {
  await completeMockLogin(page, "123456");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Your next step, at a glance" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Permanent Driving Licence" })).toBeVisible();
  await expect(page.getByText("Temporary slot offer available", { exact: true })).toBeVisible();
  await expect(page.getByText("Why you cannot continue yet", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Review temporary slot offer" }),
  ).toBeVisible();
});

test("logout clears the mock session and returns to login", async ({ page }, testInfo) => {
  await completeMockLogin(page, "123456");
  await expect(page).toHaveURL(/\/dashboard$/);

  if (testInfo.project.name === "mobile-chromium") {
    await page.getByRole("button", { name: "Open menu" }).click();
  }

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?returnTo=(?:%2F|\/)dashboard$/);
});

test("expired mock session removes private dashboard data and offers re-authentication", async ({
  page,
}) => {
  await completeMockLogin(page, "888888");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Your session has ended" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in again" })).toHaveAttribute(
    "href",
    "/login?returnTo=/dashboard",
  );
  await expect(page.getByText("Permanent Driving Licence")).not.toBeVisible();
});

test("dashboard supports an empty synthetic account", async ({ page }) => {
  await completeMockLogin(page, "654321");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "No active application" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore services" })).toBeVisible();
});

test("dashboard supports an upcoming synthetic appointment summary", async ({ page }) => {
  await completeMockLogin(page, "333222");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Upcoming appointment" })).toBeVisible();
  await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();
});

test("mobile login and dashboard remain usable at 320px", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium");
  await page.setViewportSize({ width: 320, height: 720 });
  await completeMockLogin(page, "123456");

  await expect(page).toHaveURL(/\/dashboard$/);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toContainText(
    "Synthetic citizen account",
  );
});

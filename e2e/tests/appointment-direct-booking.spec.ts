import { expect, test, type Page } from "@playwright/test";

const directBookingApplicationId = "30000000-0000-4000-8000-000000000004";
const demoOtp = process.env.E2E_DEMO_OTP;
const realAppointmentsEnabled = process.env.E2E_DATA_SOURCE === "real" && Boolean(demoOtp);

async function loginForDirectBooking(page: Page) {
  await page.goto(`/login?returnTo=/applications/${directBookingApplicationId}`);
  await page.getByLabel("Synthetic mobile number").fill("9000000005");
  await page.getByRole("button", { name: "Send synthetic OTP" }).click();
  await expect(page.getByRole("heading", { name: "Synthetic OTP sent" })).toBeVisible();
  await page.getByLabel("One-time password").fill(demoOtp ?? "");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page).toHaveURL(new RegExp(`/applications/${directBookingApplicationId}$`));
}

test.describe("real deterministic direct appointment journey", () => {
  test.skip(!realAppointmentsEnabled, "Set E2E_DATA_SOURCE=real and E2E_DEMO_OTP to run the seeded Neon journey.");

  test("books or reconstructs the direct fixture across refresh and re-login", async ({ page }, testInfo) => {
    await loginForDirectBooking(page);

    const confirmed = page.getByRole("heading", { name: "Appointment confirmed" });
    if (!(await confirmed.isVisible())) {
      await page.getByRole("button", { name: /Synthetic Rohini Demo RTO/ }).click();
      await page.getByRole("button", { name: /places remaining/ }).first().click();
      await page.getByRole("button", { name: /10:00–10:30/ }).click();
      await page.getByRole("button", { name: "Confirm appointment" }).click();
      await expect(confirmed).toBeVisible();
    }

    await expect(page.getByText("Synthetic Rohini Demo RTO")).toBeVisible();
    await expect(page.getByText("10:00–10:30")).toBeVisible();
    await page.reload();
    await expect(confirmed).toBeVisible();

    if (testInfo.project.name === "mobile-chromium") {
      await page.getByRole("button", { name: "Open menu" }).click();
    }
    await page.getByRole("button", { name: "Log out" }).click();
    await loginForDirectBooking(page);
    await expect(confirmed).toBeVisible();
  });
});

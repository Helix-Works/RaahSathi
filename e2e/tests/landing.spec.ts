import { expect, test } from "@playwright/test";

test("shows the bilingual prototype landing page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "RaahSathi" })).toBeVisible();
  await expect(page.getByText("Hackathon prototype using synthetic data.")).toBeVisible();
  await expect(page.getByText("Not an official government service.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "राहसाथी" })).toBeVisible();
});

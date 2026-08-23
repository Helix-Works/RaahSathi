import { expect, test, type Page } from "@playwright/test";

async function openServices(
  page: Page,
  projectName: string,
  labels: Readonly<{ openMenu: string; navigation: string; services: string }>,
) {
  if (projectName === "mobile-chromium") {
    await page.getByRole("button", { name: labels.openMenu }).click();
  }

  await page
    .getByRole("navigation", { name: labels.navigation })
    .getByRole("link", { name: labels.services })
    .click();
}

test("renders the public landing shell and navigates to services", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Know where you stand—and what comes next.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Hackathon prototype using synthetic data.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Not an official government service.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("contentinfo")).toContainText("Independent prototype");

  await openServices(page, testInfo.project.name, {
    openMenu: "Open menu",
    navigation:
      testInfo.project.name === "mobile-chromium"
        ? "Mobile navigation"
        : "Primary navigation",
    services: "Services",
  });

  await expect(page).toHaveURL(/\/services$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Choose the journey you need" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "New Learner Licence" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Permanent Driving Licence" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(2);
});

test("switches to Hindi and preserves it during navigation", async ({ page }, testInfo) => {
  await page.goto("/");

  await page
    .getByRole("group", { name: "Choose language" })
    .getByRole("button", { name: "हिंदी" })
    .click();

  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "जानें कि आप किस चरण में हैं—और आगे क्या करना है।",
    }),
  ).toBeVisible();

  await openServices(page, testInfo.project.name, {
    openMenu: "मेन्यू खोलें",
    navigation:
      testInfo.project.name === "mobile-chromium"
        ? "मोबाइल नेविगेशन"
        : "मुख्य नेविगेशन",
    services: "सेवाएँ",
  });

  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await expect(
    page.getByRole("heading", { level: 1, name: "अपनी ज़रूरत की यात्रा चुनें" }),
  ).toBeVisible();
  await expect(page.getByRole("contentinfo")).toContainText("स्वतंत्र प्रोटोटाइप");
});

test("mobile navigation is keyboard operable at 320px without overflow", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium");
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: "Open menu" });
  await menuButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();

  const servicesLink = page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Services" });
  await servicesLink.focus();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/services$/);
  await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).not.toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
});

test("skip link reaches the main content", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium");
  await page.goto("/");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("serves the same-origin Route Handler health contract", async ({ request }) => {
  const response = await request.get("/api/v1/health", {
    headers: { "x-request-id": "playwright-health" },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()["x-request-id"]).toBe("playwright-health");
  expect(await response.json()).toEqual({ status: "ok" });
});

import { expect, test, type Page, type TestInfo } from "@playwright/test";

const viewports = [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1440, height: 900 },
] as const;

const publicRoutes = ["/", "/services", "/login"] as const;

async function expectNoHorizontalClipping(page: Page) {
  const layout = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const clippedControls = Array.from(
      document.querySelectorAll<HTMLElement>("a, button, input, select"),
    )
      .filter((element) => {
        const style = window.getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") return false;
        const bounds = element.getBoundingClientRect();
        return bounds.width > 0 && (bounds.left < -1 || bounds.right > viewportWidth + 1);
      })
      .map((element) => element.textContent?.trim().slice(0, 60) ?? element.tagName);

    return {
      documentOverflows: document.documentElement.scrollWidth > viewportWidth,
      clippedControls,
    };
  });

  expect(layout.documentOverflows, JSON.stringify(layout)).toBe(false);
  expect(layout.clippedControls, JSON.stringify(layout)).toEqual([]);
}

async function captureIfRequested(
  page: Page,
  testInfo: TestInfo,
  locale: "en" | "hi",
  route: string,
  width: number,
) {
  if (process.env.CAPTURE_UI_QA !== "true") return;

  const routeName = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath(`${locale}-${routeName}-${width}.png`),
  });
}

async function selectHindi(page: Page) {
  await page.goto("/");
  await page.context().addCookies([{ name: "raahsathi_locale", value: "hi", url: page.url() }]);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
}

async function completeMockLogin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Mobile number").fill("9000000000");
  await page.getByRole("button", { name: "Send OTP" }).click();
  await page.getByLabel("One-time password").fill("123456");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("public routes remain fluid across the required English viewports", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium");

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    for (const route of publicRoutes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expectNoHorizontalClipping(page);
      await captureIfRequested(page, testInfo, "en", route, viewport.width);
    }
  }
});

for (const viewport of viewports) {
  for (const route of publicRoutes) {
    test(`public route ${route} remains fluid in Hindi at ${viewport.width}px`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop-chromium");
      await page.setViewportSize(viewport);
      await selectHindi(page);
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", "hi");
      await expectNoHorizontalClipping(page);
      await captureIfRequested(page, testInfo, "hi", route, viewport.width);
    });
  }
}

test("dashboard remains fluid in English and Hindi at every required viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium");
  await completeMockLogin(page);

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoHorizontalClipping(page);
    await captureIfRequested(page, testInfo, "en", "/dashboard", viewport.width);
  }

  await page.context().addCookies([{ name: "raahsathi_locale", value: "hi", url: page.url() }]);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoHorizontalClipping(page);
    await captureIfRequested(page, testInfo, "hi", "/dashboard", viewport.width);
  }
});

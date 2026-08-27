import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { expect, test, type Page } from "@playwright/test";

const repositoryRoot = resolve(process.cwd(), "..");
const heroApplicationId = "30000000-0000-4000-8000-000000000006";
const permanentApplicationId = "30000000-0000-4000-8000-000000000007";
const heroMobile = "9000000007";
const demoOtp = process.env.AUTH_DEMO_OTP ?? "";
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? "";

const copies = {
  en: {
    lang: "en",
    languageGroup: "Choose language",
    requestOtp: "Send synthetic OTP",
    verifyOtp: "Verify and continue",
    continue: "Continue",
    saveDraft: "Save draft",
    saveAndContinue: "Save and continue",
    saved: "Draft saved in PostgreSQL.",
    serviceDetails: "Service details",
    logout: "Log out",
    openMenu: "Open menu",
    permanent: "Permanent Driving Licence",
    licence: "Synthetic licence context",
    rtoName: "Synthetic Rohini Hero RTO",
    full: "This appointment slot is full.",
    unreleased: "Appointment slots have not been released yet.",
    joined: "Joined",
    afternoon: "Afternoon",
    update: "Update preferences",
    waiting: "Waiting for a suitable appointment slot",
    refresh: "Refresh waitlist status",
    offer: "Temporary appointment offer",
    remaining: "Time remaining",
    accept: "Accept offer",
    confirmed: "Appointment confirmed",
    dashboardAppointment: "Upcoming appointment",
  },
  hi: {
    lang: "hi",
    languageGroup: "भाषा चुनें",
    requestOtp: "कृत्रिम ओटीपी भेजें",
    verifyOtp: "सत्यापित करके आगे बढ़ें",
    continue: "आगे बढ़ें",
    saveDraft: "ड्राफ्ट सहेजें",
    saveAndContinue: "सहेजकर आगे बढ़ें",
    saved: "ड्राफ्ट PostgreSQL में सहेजा गया।",
    serviceDetails: "सेवा विवरण",
    logout: "लॉग आउट",
    openMenu: "मेन्यू खोलें",
    permanent: "स्थायी ड्राइविंग लाइसेंस",
    licence: "कृत्रिम लाइसेंस संदर्भ",
    rtoName: "कृत्रिम रोहिणी हीरो आरटीओ",
    full: "यह अपॉइंटमेंट स्लॉट भर चुका है।",
    unreleased: "अपॉइंटमेंट स्लॉट अभी जारी नहीं किए गए हैं।",
    joined: "शामिल होने का समय",
    afternoon: "दोपहर",
    update: "पसंद बदलें",
    waiting: "उपयुक्त अपॉइंटमेंट स्लॉट की प्रतीक्षा",
    refresh: "वेटलिस्ट स्थिति ताज़ा करें",
    offer: "अस्थायी अपॉइंटमेंट ऑफ़र",
    remaining: "शेष समय",
    accept: "ऑफ़र स्वीकार करें",
    confirmed: "अपॉइंटमेंट पक्का है",
    dashboardAppointment: "\u0906\u0917\u093e\u092e\u0940 \u0905\u092a\u0949\u0907\u0902\u091f\u092e\u0947\u0902\u091f",
  },
} as const;

function runDemoCommand(command: "demo:reset" | "demo:stage:permanent" | "demo:release-slot"): void {
  const pnpmCli = process.env.npm_execpath;
  if (!pnpmCli) throw new Error("npm_execpath is required to run the approved Phase 7 demo commands.");
  const result = spawnSync(pnpmCli, ["--filter", "@raahsathi/web", command], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
      DIRECT_URL: testDatabaseUrl,
    },
    encoding: "utf8",
  });
  if (result.status !== 0) {
    const secrets = [testDatabaseUrl, process.env.DATABASE_URL].filter((value): value is string => Boolean(value));
    const diagnostic = secrets.reduce(
      (message, secret) => message.replaceAll(secret, "[redacted]"),
      `${result.stdout}\n${result.stderr}`.trim(),
    );
    throw new Error(`The approved ${command} command failed with exit code ${result.status ?? "unknown"}: ${diagnostic}`);
  }
}

function tomorrowDate(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport);
}

async function selectHindi(page: Page): Promise<void> {
  if ((await page.locator("html").getAttribute("lang")) === "hi") return;
  await page
    .getByRole("group", { name: copies.en.languageGroup })
    .getByRole("button", { name: "हिंदी" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
}

async function login(page: Page, locale: keyof typeof copies): Promise<void> {
  const copy = copies[locale];
  await page.goto("/login?returnTo=/dashboard");
  if (locale === "hi") await selectHindi(page);
  await page.locator("#synthetic-mobile").fill(heroMobile);
  await page.getByRole("button", { name: copy.requestOtp }).click();
  await page.locator("#synthetic-otp").fill(demoOtp);
  await page.getByRole("button", { name: copy.verifyOtp }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator("html")).toHaveAttribute("lang", copy.lang);
}

async function logout(page: Page, locale: keyof typeof copies): Promise<void> {
  const copy = copies[locale];
  const menu = page.getByRole("button", { name: copy.openMenu });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("button", { name: copy.logout }).click();
  await expect(page).toHaveURL(/\/login/);
}

async function assertNoCriticalEnglishFallback(page: Page): Promise<void> {
  const body = page.locator("body");
  for (const phrase of [
    "Choose an RTO",
    "Time remaining",
    "Join waitlist",
    "Temporary appointment offer",
    "Appointment confirmed",
    "Synthetic licence context",
  ]) {
    await expect(body).not.toContainText(phrase);
  }
}

for (const locale of ["en", "hi"] as const) {
  test(`completes the deterministic Phase 7 hero journey in ${locale === "en" ? "English" : "Hindi"}`, async ({ page }) => {
    const copy = copies[locale];
    runDemoCommand("demo:reset");

    await login(page, locale);
    await expectNoHorizontalOverflow(page);
    await page.getByRole("link", { name: copy.continue, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/applications/${heroApplicationId}$`));
    await expect(page.locator("#postalCode")).toHaveValue("110085");
    await page.locator("#postalCode").fill("110086");
    await page.getByRole("button", { name: copy.saveDraft }).click();
    await expect(page.getByText(copy.saved, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: copy.saveAndContinue }).click();
    await expect(page.getByRole("heading", { name: copy.serviceDetails })).toBeVisible();

    await logout(page, locale);
    // The security policy intentionally enforces a one-minute OTP resend cooldown.
    // Waiting proves renewed login without weakening or bypassing that policy.
    await page.waitForTimeout(61_000);
    await login(page, locale);
    await page.getByRole("link", { name: copy.continue, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/applications/${heroApplicationId}$`));
    await expect(page.getByRole("heading", { name: copy.serviceDetails })).toBeVisible();

    runDemoCommand("demo:stage:permanent");
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: copy.permanent })).toBeVisible();
    await page.getByRole("link", { name: copy.continue, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/applications/${permanentApplicationId}$`));
    await expect(page.getByRole("heading", { name: copy.licence })).toBeVisible();
    await expect(page.getByText("SYN-LL-PHASE7-0007", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: new RegExp(copy.rtoName) }).click();
    await expect(page.getByText(copy.full, { exact: true })).toBeVisible();
    await expect(page.getByText(copy.unreleased, { exact: true }).first()).toBeVisible();

    const slotDate = tomorrowDate();
    await page.locator("#waitlist-rto").selectOption({ label: copy.rtoName });
    await page.locator("#waitlist-from").fill(slotDate);
    await page.locator("#waitlist-to").fill(slotDate);
    await page.getByRole("button", { name: locale === "en" ? "Join waitlist" : "वेटलिस्ट में शामिल हों" }).click();
    await expect(page.getByText(copy.waiting, { exact: true })).toBeVisible({ timeout: 30_000 });
    const joinedValue = page.locator("dt", { hasText: copy.joined }).locator("..").locator("dd");
    const immutableJoinTime = await joinedValue.textContent();
    await page.getByLabel(copy.afternoon).check();
    await page.getByRole("button", { name: copy.update }).click();
    await expect(joinedValue).toHaveText(immutableJoinTime ?? "");

    runDemoCommand("demo:release-slot");
    await page.getByRole("button", { name: copy.refresh }).click();
    await expect(page.getByRole("heading", { name: copy.offer, level: 2, exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("09:00–09:30", { exact: true })).toBeVisible();
    await expect(page.getByText(new RegExp(`${copy.remaining}:`))).toBeVisible();
    await page.getByRole("button", { name: copy.accept }).click();
    await expect(page.getByText(copy.confirmed, { exact: true })).toBeVisible({ timeout: 30_000 });

    await page.reload();
    await expect(page.getByText(copy.confirmed, { exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: copy.permanent })).toBeVisible();
    await expect(page.getByRole("heading", { name: copy.dashboardAppointment, level: 3, exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    if (locale === "hi") await assertNoCriticalEnglishFallback(page);
  });
}

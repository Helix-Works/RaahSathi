import { describe, expect, it } from "vitest";

import { buildReviewerLoginHint } from "./reviewer-login-hint";

describe("reviewer login hint", () => {
  it("is absent by default", () => {
    expect(buildReviewerLoginHint({
      AUTH_DEMO_OTP: "123456",
      SHOW_REVIEWER_LOGIN_HINTS: false,
    }, "en")).toBeUndefined();
    expect(buildReviewerLoginHint({}, "en")).toBeUndefined();
  });

  it("exposes only the synthetic reviewer values with bilingual copy", () => {
    const environment = { AUTH_DEMO_OTP: "654321", SHOW_REVIEWER_LOGIN_HINTS: true } as const;
    const english = buildReviewerLoginHint(environment, "en");
    const hindi = buildReviewerLoginHint(environment, "hi");

    expect(english).toMatchObject({ mobileNumbers: ["9000000000", "9000000006"], otp: "654321" });
    expect(hindi).toMatchObject({ mobileNumbers: ["9000000000", "9000000006"], otp: "654321" });
    expect(JSON.stringify({ english, hindi })).not.toContain("pepper");
    expect(english?.notice).toMatch(/fictional reviewer/i);
    expect(hindi?.notice).toContain("काल्पनिक");
  });

  it("fails closed when enabled without a valid configured OTP", () => {
    expect(() => buildReviewerLoginHint({ SHOW_REVIEWER_LOGIN_HINTS: "true" }, "en")).toThrow(/six digits/);
    expect(() => buildReviewerLoginHint({ AUTH_DEMO_OTP: "secret", SHOW_REVIEWER_LOGIN_HINTS: true }, "en")).toThrow(/six digits/);
  });
});

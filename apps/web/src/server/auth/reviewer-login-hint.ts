import "server-only";

import type { ReviewerLoginHint } from "@/features/auth/types";
import type { Locale } from "@/i18n";

type ReviewerEnvironment = Readonly<{
  AUTH_DEMO_OTP?: string;
  SHOW_REVIEWER_LOGIN_HINTS?: string | boolean;
}>;

export function buildReviewerLoginHint(
  environment: ReviewerEnvironment,
  locale: Locale,
): ReviewerLoginHint | undefined {
  const enabled = environment.SHOW_REVIEWER_LOGIN_HINTS === true
    || environment.SHOW_REVIEWER_LOGIN_HINTS === "true";
  if (!enabled) return undefined;
  if (!environment.AUTH_DEMO_OTP || !/^[0-9]{6}$/.test(environment.AUTH_DEMO_OTP)) {
    throw new Error("AUTH_DEMO_OTP must be six digits when reviewer login hints are enabled.");
  }

  if (locale === "hi") {
    return {
      mobileNumbers: ["9000000000", "9000000006"],
      otp: environment.AUTH_DEMO_OTP,
      mobileLabel: "समीक्षक परीक्षण मोबाइल नंबर",
      otpLabel: "समीक्षक परीक्षण ओटीपी",
      notice: "यह केवल काल्पनिक परीक्षण खाते के लिए है। वास्तविक व्यक्तिगत जानकारी दर्ज न करें।",
    };
  }

  return {
    mobileNumbers: ["9000000000", "9000000006"],
    otp: environment.AUTH_DEMO_OTP,
    mobileLabel: "Reviewer test mobiles",
    otpLabel: "Reviewer test OTP",
    notice: "For the fictional reviewer account only. Do not enter real personal information.",
  };
}

export function getReviewerLoginHint(locale: Locale): ReviewerLoginHint | undefined {
  return buildReviewerLoginHint({
    AUTH_DEMO_OTP: process.env.AUTH_DEMO_OTP,
    SHOW_REVIEWER_LOGIN_HINTS: process.env.SHOW_REVIEWER_LOGIN_HINTS,
  }, locale);
}

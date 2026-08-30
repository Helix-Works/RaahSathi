import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ReviewerLoginHint } from "./reviewer-login-hint";

const hint = {
  mobileNumber: "9000000000",
  otp: "123456",
  mobileLabel: "Reviewer test mobile",
  otpLabel: "Reviewer test OTP",
  notice: "Fictional test account only.",
} as const;

describe("ReviewerLoginHint", () => {
  it("renders only the requested field value", () => {
    const mobile = renderToStaticMarkup(<ReviewerLoginHint hint={hint} field="mobile" />);
    const otp = renderToStaticMarkup(<ReviewerLoginHint hint={hint} field="otp" />);

    expect(mobile).toContain("9000000000");
    expect(mobile).not.toContain("123456");
    expect(otp).toContain("123456");
    expect(otp).not.toContain("9000000000");
  });
});

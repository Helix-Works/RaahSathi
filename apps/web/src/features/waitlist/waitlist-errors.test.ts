import { describe, expect, it } from "vitest";

import { enMessages } from "@/i18n/messages/en";
import { ApiClientError } from "@/lib/api";
import { waitlistErrorPresentation } from "./waitlist-errors";

function error(code: string, status = 409, retryAfterSeconds?: number) {
  return new ApiClientError({ status, code, messageKey: "errors.requestFailed", retryable: status >= 429, retryAfterSeconds });
}

describe("waitlist error recovery", () => {
  it.each(["WAITLIST_ALREADY_ACTIVE", "WAITLIST_OFFER_ACTIVE", "OFFER_EXPIRED", "OFFER_ALREADY_CONSUMED", "OFFER_STATE_CONFLICT"])("reconstructs authoritative state after %s", (code) => {
    expect(waitlistErrorPresentation(error(code), "en", enMessages.waitlist).action).toBe("recover");
  });

  it("honors Retry-After and never reveals an unknown internal error", () => {
    expect(waitlistErrorPresentation(error("WAITLIST_RATE_LIMITED", 429, 30), "en", enMessages.waitlist).message).toContain("30 seconds");
    expect(waitlistErrorPresentation(new Error("Prisma password"), "en", enMessages.waitlist).message).not.toContain("Prisma");
  });
});

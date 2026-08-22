import { describe, expect, it } from "vitest";

import { ApiError } from "@/server/http/api-error";

import { assertResourceOwner, ownerScopedWhere } from "./authorization";
import { csrfCookieOptions, readCookie, sessionCookieOptions } from "./cookies";
import { hashOtp, keyedHash, randomBase64Url, safeEqual, sha256 } from "./crypto";
import { maskMobile, mobileLookupHash, normalizeSyntheticMobile } from "./mobile";

describe("Phase 1 authentication foundation", () => {
  it("normalizes and masks valid synthetic mobiles without retaining the raw value in lookup hashes", () => {
    const normalized = normalizeSyntheticMobile("9000000000");
    const hash = mobileLookupHash("9000000000", "a-development-pepper-that-is-long-enough");
    expect(normalized).toBe("+919000000000");
    expect(maskMobile("9000000000")).toBe("••••••0000");
    expect(hash).not.toContain("9000000000");
    expect(() => normalizeSyntheticMobile("123")).toThrow();
  });

  it("uses keyed OTP hashes and constant-time compatible comparisons", () => {
    const first = hashOtp("123456", "salt", "pepper");
    expect(first).toBe(hashOtp("123456", "salt", "pepper"));
    expect(first).not.toBe(hashOtp("654321", "salt", "pepper"));
    expect(keyedHash("value", "one")).not.toBe(keyedHash("value", "two"));
    expect(safeEqual(first, first)).toBe(true);
    expect(safeEqual(first, sha256("different"))).toBe(false);
  });

  it("issues independent opaque random values", () => {
    const session = randomBase64Url(32);
    const csrf = randomBase64Url(32);
    expect(session).not.toBe(csrf);
    expect(session).not.toContain("123456");
  });

  it("applies secure production cookie flags and parses exact cookie names", () => {
    const expires = new Date("2026-08-23T12:00:00.000Z");
    expect(sessionCookieOptions(expires, true)).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/" });
    expect(csrfCookieOptions(expires, true)).toMatchObject({ httpOnly: false, secure: true });
    expect(readCookie("one=1; raahsathi_session=opaque%20token", "raahsathi_session")).toBe("opaque token");
  });

  it("enforces owner-scoped access", () => {
    const context = { sessionId: "session", applicantId: "applicant-a" };
    expect(ownerScopedWhere(context, { id: "resource" })).toEqual({ id: "resource", applicantId: "applicant-a" });
    expect(() => assertResourceOwner("applicant-a", context)).not.toThrow();
    expect(() => assertResourceOwner("applicant-b", context)).toThrow(ApiError);
  });
});

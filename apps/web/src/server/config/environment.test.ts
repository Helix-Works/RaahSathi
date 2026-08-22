import { describe, expect, it } from "vitest";

import { parseEnvironment } from "./environment";

describe("server environment", () => {
  const auth = {
    AUTH_MOBILE_LOOKUP_PEPPER: "development-mobile-pepper-32-characters",
    AUTH_OTP_PEPPER: "development-otp-pepper-at-least-32-chars",
    AUTH_DEMO_OTP: "123456",
  };

  it("accepts PostgreSQL development configuration", () => {
    expect(parseEnvironment({ ...auth, NODE_ENV: "development", DATABASE_URL: "postgresql://user:pass@localhost/db" })).toMatchObject({ NODE_ENV: "development" });
  });

  it("rejects non-PostgreSQL URLs and production URLs without TLS", () => {
    expect(() => parseEnvironment({ ...auth, DATABASE_URL: "https://example.com/db" })).toThrow();
    expect(() => parseEnvironment({ ...auth, NODE_ENV: "production", DATABASE_URL: "postgresql://user:pass@example.com/db" })).toThrow(/TLS/);
  });
});

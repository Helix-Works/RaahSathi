import { afterEach, describe, expect, it } from "vitest";

import { checkRateLimit, defaultReadRateLimit, rateLimitKey } from "./rate-limit";

const originalTrustProxy = process.env.TRUST_PROXY_HEADERS;

afterEach(() => {
  if (originalTrustProxy === undefined) delete process.env.TRUST_PROXY_HEADERS;
  else process.env.TRUST_PROXY_HEADERS = originalTrustProxy;
});

function request(init?: RequestInit): Request {
  return new Request("http://localhost/api/v1/read", init);
}

describe("global in-memory rate limiter", () => {
  it("allows requests up to the window and then blocks with a retry-after", () => {
    for (let i = 0; i < defaultReadRateLimit.maxRequests; i += 1) {
      expect(checkRateLimit("test-id", defaultReadRateLimit).allowed).toBe(true);
    }
    const blocked = checkRateLimit("test-id", defaultReadRateLimit);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keys entries by identifier and window", () => {
    checkRateLimit("other-id", defaultReadRateLimit);
    expect(checkRateLimit("fresh-id", defaultReadRateLimit).allowed).toBe(true);
  });
});

describe("rateLimitKey derivation", () => {
  it("uses the last trusted x-forwarded-for hop when prototype proxies headers are trusted", () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    const key = rateLimitKey(
      request({ headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } }),
      "read",
    );
    expect(key).toBe("5.6.7.8:read");
  });

  it("does not trust an unverified x-forwarded-for header", () => {
    delete process.env.TRUST_PROXY_HEADERS;
    const key = rateLimitKey(
      request({ headers: { "x-forwarded-for": "1.2.3.4" } }),
      "read",
    );
    expect(key).not.toContain("1.2.3.4");
    expect(key).toContain(":read");
  });

  it("scopes to the signed-in session when present", () => {
    delete process.env.TRUST_PROXY_HEADERS;
    const key = rateLimitKey(
      request({ headers: { cookie: "raahsathi_session=abc123def456ghi789" } }),
      "read",
    );
    expect(key.startsWith("session:")).toBe(true);
    expect(key.endsWith(":read")).toBe(true);
  });

  it("scopes to a per-instance bucket instead of collapsing to one shared key", () => {
    delete process.env.TRUST_PROXY_HEADERS;
    const keyA = rateLimitKey(request(), "read");
    const keyB = rateLimitKey(request(), "read");
    expect(keyA.startsWith("instance:")).toBe(true);
    expect(keyA).toBe(keyB);
  });
});


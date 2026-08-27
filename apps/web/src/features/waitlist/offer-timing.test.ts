import { describe, expect, it } from "vitest";

import { offerTiming } from "./offer-timing";

describe("offer visual timing boundary", () => {
  const expiresAt = "2026-08-27T12:30:00.000Z";

  it("keeps acceptance available before expiry", () => {
    expect(offerTiming(expiresAt, Date.parse("2026-08-27T12:29:59.000Z"))).toEqual({
      remainingMilliseconds: 1_000,
      acceptanceDisabled: false,
    });
  });

  it("disables browser acceptance at and after expiry", () => {
    expect(offerTiming(expiresAt, Date.parse(expiresAt)).acceptanceDisabled).toBe(true);
    expect(offerTiming(expiresAt, Date.parse("2026-08-27T12:30:01.000Z")).acceptanceDisabled).toBe(true);
  });
});

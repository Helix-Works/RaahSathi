import { describe, expect, it } from "vitest";

import { assertPhase7HeroCommandEnvironment } from "./phase7-hero-command-safety";

describe("Phase 7 hero command safety", () => {
  it("allows local and disposable-test command environments", () => {
    expect(() => assertPhase7HeroCommandEnvironment({ NODE_ENV: "development" })).not.toThrow();
    expect(() => assertPhase7HeroCommandEnvironment({ NODE_ENV: "test", VERCEL_ENV: "preview" })).not.toThrow();
  });

  it("fails closed for production-like command environments", () => {
    expect(() => assertPhase7HeroCommandEnvironment({ NODE_ENV: "production" })).toThrow(/disabled/i);
    expect(() => assertPhase7HeroCommandEnvironment({ VERCEL_ENV: "production" })).toThrow(/disabled/i);
  });
});

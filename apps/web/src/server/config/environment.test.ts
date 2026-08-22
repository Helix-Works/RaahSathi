import { describe, expect, it } from "vitest";

import { parseEnvironment } from "./environment";

describe("server environment", () => {
  it("accepts PostgreSQL development configuration", () => {
    expect(parseEnvironment({ NODE_ENV: "development", DATABASE_URL: "postgresql://user:pass@localhost/db" })).toMatchObject({ NODE_ENV: "development" });
  });

  it("rejects non-PostgreSQL URLs and production URLs without TLS", () => {
    expect(() => parseEnvironment({ DATABASE_URL: "https://example.com/db" })).toThrow();
    expect(() => parseEnvironment({ NODE_ENV: "production", DATABASE_URL: "postgresql://user:pass@example.com/db" })).toThrow(/TLS/);
  });
});

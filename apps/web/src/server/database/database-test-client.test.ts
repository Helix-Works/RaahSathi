import { describe, expect, it } from "vitest";

import { databaseTestConnectionUrl } from "./database-test-client";

describe("database test client", () => {
  it("adds bounded connection settings without changing the database identity", () => {
    const url = new URL(databaseTestConnectionUrl("postgresql://user:secret@db.example/app_test?sslmode=require"));
    expect(`${url.hostname}${url.pathname}`).toBe("db.example/app_test");
    expect(url.searchParams.get("connect_timeout")).toBe("15");
    expect(url.searchParams.get("pool_timeout")).toBe("15");
    expect(url.searchParams.get("connection_limit")).toBe("5");
  });

  it("preserves explicitly configured connection settings", () => {
    const url = new URL(databaseTestConnectionUrl(
      "postgresql://user:secret@db.example/app_test?connect_timeout=20&pool_timeout=25&connection_limit=3",
    ));
    expect(url.searchParams.get("connect_timeout")).toBe("20");
    expect(url.searchParams.get("pool_timeout")).toBe("25");
    expect(url.searchParams.get("connection_limit")).toBe("3");
  });

  it("rejects a missing database URL without logging it", () => {
    expect(() => databaseTestConnectionUrl(undefined)).toThrow("A disposable database URL is required");
  });
});

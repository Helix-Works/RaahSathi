import { describe, expect, it } from "vitest";

import {
  databaseIdentity,
  disposableDatabaseConfirmation,
  isDisposableDatabaseApproved,
} from "./database-test-safety";

describe("database test safety", () => {
  it("normalizes a PostgreSQL database identity without credentials or query parameters", () => {
    expect(databaseIdentity("postgresql://user:secret@DB.EXAMPLE/test_db?sslmode=require")).toBe(
      "db.example:5432/test_db",
    );
  });

  it("rejects malformed URLs, non-PostgreSQL URLs, and URLs without a database name", () => {
    expect(databaseIdentity("not-a-url")).toBeUndefined();
    expect(databaseIdentity("https://db.example/test_db")).toBeUndefined();
    expect(databaseIdentity("postgresql://db.example")).toBeUndefined();
  });

  it("requires the exact confirmation and a database distinct from DATABASE_URL", () => {
    const testDatabaseUrl = "postgresql://test:secret@db.example/app_test?sslmode=require";
    const primaryDatabaseUrl = "postgresql://prod:other@DB.EXAMPLE/app_test?sslmode=disable";
    expect(isDisposableDatabaseApproved({ testDatabaseUrl, primaryDatabaseUrl, confirmation: disposableDatabaseConfirmation })).toBe(false);
    expect(isDisposableDatabaseApproved({ testDatabaseUrl, primaryDatabaseUrl: undefined, confirmation: disposableDatabaseConfirmation })).toBe(false);
    expect(isDisposableDatabaseApproved({ testDatabaseUrl, primaryDatabaseUrl: "not-a-url", confirmation: disposableDatabaseConfirmation })).toBe(false);
    expect(isDisposableDatabaseApproved({ testDatabaseUrl, primaryDatabaseUrl: "postgresql://prod@db.example/app", confirmation: "yes" })).toBe(false);
    expect(isDisposableDatabaseApproved({ testDatabaseUrl, primaryDatabaseUrl: "postgresql://prod@db.example/app", confirmation: disposableDatabaseConfirmation })).toBe(true);
  });
});

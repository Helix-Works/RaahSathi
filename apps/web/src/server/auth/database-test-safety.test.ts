import { describe, expect, it } from "vitest";

import {
  assertDisposableDatabaseApproved,
  databaseIdentity,
  disposableDatabaseConfirmation,
  isDisposableDatabaseApproved,
} from "./database-test-safety";

const disposableConfiguration = {
  testDatabaseUrl: "postgresql://test:secret@db.example/app_test?sslmode=require",
  primaryDatabaseUrl: "postgresql://prod:other@db.example/app?sslmode=require",
  confirmation: disposableDatabaseConfirmation,
} as const;

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

  it("rejects missing test and primary database URLs", () => {
    expect(isDisposableDatabaseApproved({ ...disposableConfiguration, testDatabaseUrl: undefined })).toBe(false);
    expect(isDisposableDatabaseApproved({ ...disposableConfiguration, primaryDatabaseUrl: undefined })).toBe(false);
  });

  it("rejects malformed test and primary database URLs", () => {
    expect(isDisposableDatabaseApproved({ ...disposableConfiguration, testDatabaseUrl: "not-a-url" })).toBe(false);
    expect(isDisposableDatabaseApproved({ ...disposableConfiguration, primaryDatabaseUrl: "not-a-url" })).toBe(false);
  });

  it("rejects identical normalized database identities", () => {
    expect(isDisposableDatabaseApproved({
      ...disposableConfiguration,
      primaryDatabaseUrl: "postgresql://prod:other@DB.EXAMPLE/app_test?sslmode=disable",
    })).toBe(false);
  });

  it("requires the exact disposable-database confirmation", () => {
    expect(isDisposableDatabaseApproved({ ...disposableConfiguration, confirmation: "yes" })).toBe(false);
  });

  it("approves only a confirmed database distinct from DATABASE_URL", () => {
    expect(isDisposableDatabaseApproved(disposableConfiguration)).toBe(true);
    expect(() => assertDisposableDatabaseApproved(disposableConfiguration)).not.toThrow();
  });

  it("fails closed without exposing either database URL", () => {
    expect(() => assertDisposableDatabaseApproved({
      ...disposableConfiguration,
      confirmation: undefined,
    })).toThrow("Refusing database tests: configure a confirmed disposable TEST_DATABASE_URL distinct from DATABASE_URL.");
  });
});

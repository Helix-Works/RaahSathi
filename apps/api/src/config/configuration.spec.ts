import { validateEnvironment } from "./configuration";

const validConfiguration = {
  NODE_ENV: "development",
  PORT: "3001",
  WEB_ORIGIN: "http://localhost:3000/path",
  DATABASE_URL: "postgresql://runtime.invalid/raahsathi",
  DIRECT_URL: "postgresql://direct.invalid/raahsathi",
  SHADOW_DATABASE_URL: "postgresql://shadow.invalid/raahsathi_shadow",
};

describe("validateEnvironment", () => {
  it("normalizes a valid development configuration", () => {
    expect(validateEnvironment(validConfiguration)).toMatchObject({
      NODE_ENV: "development",
      PORT: 3001,
      WEB_ORIGIN: "http://localhost:3000",
    });
  });

  it.each([
    ["NODE_ENV", { NODE_ENV: "staging" }, "NODE_ENV must be development, test, or production."],
    ["PORT", { PORT: "70000" }, "PORT must be an integer between 1 and 65535."],
    ["WEB_ORIGIN", { WEB_ORIGIN: "file:///tmp" }, "WEB_ORIGIN must use http or https."],
    [
      "DATABASE_URL",
      { DATABASE_URL: "mysql://user:secret@database.invalid/app" },
      "DATABASE_URL must be a valid PostgreSQL connection URL.",
    ],
  ])("rejects an invalid %s without reflecting its value", (_key, override, expectedMessage) => {
    expect(() => validateEnvironment({ ...validConfiguration, ...override })).toThrow(
      expectedMessage,
    );
  });

  it("requires TLS for production database connections", () => {
    expect(() =>
      validateEnvironment({ ...validConfiguration, NODE_ENV: "production" }),
    ).toThrow("DATABASE_URL must require TLS in production.");
  });

  it("accepts production database connections that require TLS", () => {
    const configuration = Object.fromEntries(
      Object.entries(validConfiguration).map(([key, value]) => [
        key,
        key.endsWith("_URL") && key !== "WEB_ORIGIN" ? `${value}?sslmode=require` : value,
      ]),
    );

    expect(validateEnvironment({ ...configuration, NODE_ENV: "production" })).toMatchObject({
      NODE_ENV: "production",
      PORT: 3001,
    });
  });

  it("does not leak a rejected connection string", () => {
    const secretUrl = "mysql://user:do-not-leak@database.invalid/app";

    try {
      validateEnvironment({ ...validConfiguration, DATABASE_URL: secretUrl });
      throw new Error("Expected validation to fail.");
    } catch (error) {
      expect((error as Error).message).not.toContain("do-not-leak");
      expect((error as Error).message).not.toContain(secretUrl);
    }
  });
});

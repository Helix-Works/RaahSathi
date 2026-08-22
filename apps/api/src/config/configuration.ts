const nodeEnvironments = new Set(["development", "test", "production"]);

const databaseEnvironmentKeys = [
  "DATABASE_URL",
  "DIRECT_URL",
  "SHADOW_DATABASE_URL",
] as const;

function parseDatabaseUrl(key: (typeof databaseEnvironmentKeys)[number], value: unknown): URL {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(String(value ?? ""));
  } catch {
    throw new Error(`${key} must be a valid PostgreSQL connection URL.`);
  }

  if (!["postgres:", "postgresql:"].includes(parsedUrl.protocol)) {
    throw new Error(`${key} must be a valid PostgreSQL connection URL.`);
  }

  return parsedUrl;
}

function hasRequiredTls(url: URL): boolean {
  const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
  return sslMode === "require" || sslMode === "verify-full";
}

export function validateEnvironment(config: Record<string, unknown>) {
  const nodeEnv = String(config.NODE_ENV ?? "development");
  const port = Number(config.PORT ?? 3001);
  const webOrigin = String(config.WEB_ORIGIN ?? "http://localhost:3000");

  if (!nodeEnvironments.has(nodeEnv)) {
    throw new Error("NODE_ENV must be development, test, or production.");
  }

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(webOrigin);
  } catch {
    throw new Error("WEB_ORIGIN must be a valid URL.");
  }

  if (!["http:", "https:"].includes(parsedOrigin.protocol)) {
    throw new Error("WEB_ORIGIN must use http or https.");
  }

  const databaseUrls = Object.fromEntries(
    databaseEnvironmentKeys.map((key) => [key, parseDatabaseUrl(key, config[key])]),
  ) as Record<(typeof databaseEnvironmentKeys)[number], URL>;

  if (nodeEnv === "production") {
    for (const key of databaseEnvironmentKeys) {
      if (!hasRequiredTls(databaseUrls[key])) {
        throw new Error(`${key} must require TLS in production.`);
      }
    }
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: port,
    WEB_ORIGIN: parsedOrigin.origin,
    ...Object.fromEntries(databaseEnvironmentKeys.map((key) => [key, databaseUrls[key].toString()])),
  };
}

const nodeEnvironments = new Set(["development", "test", "production"]);

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

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: port,
    WEB_ORIGIN: parsedOrigin.origin,
  };
}

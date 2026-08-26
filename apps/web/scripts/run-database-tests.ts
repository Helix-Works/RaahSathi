import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { assertDisposableDatabaseApproved } from "../src/server/auth/database-test-safety";

assertDisposableDatabaseApproved({
  testDatabaseUrl: process.env.TEST_DATABASE_URL,
  primaryDatabaseUrl: process.env.DATABASE_URL,
  confirmation: process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION,
});

const webRoot = fileURLToPath(new URL("..", import.meta.url));
const vitestEntryPoint = fileURLToPath(new URL("../node_modules/vitest/vitest.mjs", import.meta.url));
const result = spawnSync(
  process.execPath,
  [vitestEntryPoint, "run", "--config", "vitest.database.config.ts"],
  { cwd: webRoot, env: process.env, stdio: "inherit" },
);

if (result.error) {
  throw new Error("Unable to start the database test runner.", { cause: result.error });
}

process.exitCode = result.status ?? 1;

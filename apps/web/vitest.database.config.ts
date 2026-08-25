import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "server-only": fileURLToPath(new URL("./test/server-only.ts", import.meta.url)) },
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/server/**/*.database.test.ts"],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    teardownTimeout: 30_000,
  },
});

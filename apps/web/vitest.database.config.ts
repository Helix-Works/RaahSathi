import { defineConfig } from "vitest/config";

import { createVitestBaseConfig } from "./vitest.config.js";

const vitestBaseConfig = createVitestBaseConfig();

export default defineConfig({
  ...vitestBaseConfig,
  test: {
    ...vitestBaseConfig.test,
    environment: "node",
    include: ["src/server/**/*.database.test.ts"],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    teardownTimeout: 30_000,
  },
});

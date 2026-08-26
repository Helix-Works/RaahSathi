import { fileURLToPath } from "node:url";

import { configDefaults, defineConfig } from "vitest/config";

export function createVitestBaseConfig() {
  return {
    resolve: {
      alias: { "server-only": fileURLToPath(new URL("./test/server-only.ts", import.meta.url)) },
      tsconfigPaths: true,
    },
    test: { environment: "node" as const },
  };
}

const vitestBaseConfig = createVitestBaseConfig();

export default defineConfig({
  ...vitestBaseConfig,
  test: {
    ...vitestBaseConfig.test,
    exclude: [...configDefaults.exclude, "src/server/**/*.database.test.ts"],
  },
});

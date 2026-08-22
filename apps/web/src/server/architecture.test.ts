import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("server-only architecture", () => {
  it("does not import server modules from the current client entry points", async () => {
    const files = ["src/app/page.tsx", "src/lib/api.ts"];
    for (const file of files) {
      const source = await readFile(resolve(process.cwd(), file), "utf8");
      expect(source).not.toMatch(/from ["']@\/server\//);
    }
  });
});

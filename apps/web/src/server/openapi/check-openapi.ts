import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { normalizeOpenApiLineEndings, serializeOpenApiDocument } from "./document";

const outputPath = resolve(process.cwd(), "../../docs/api/openapi.json");

async function main(): Promise<void> {
  const committed = await readFile(outputPath, "utf8");
  if (normalizeOpenApiLineEndings(committed) !== serializeOpenApiDocument()) {
    throw new Error("docs/api/openapi.json is stale. Run pnpm openapi:generate.");
  }
  console.info("OpenAPI document is current.");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

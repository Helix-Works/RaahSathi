import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { serializeOpenApiDocument } from "./document";

const outputPath = resolve(process.cwd(), "../../docs/api/openapi.json");

async function main(): Promise<void> {
  await writeFile(outputPath, serializeOpenApiDocument(), "utf8");
  console.info(`Wrote ${outputPath}`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { NestFactory } from "@nestjs/core";

const placeholderDatabaseUrl = "postgresql://openapi.invalid/raahsathi";

async function generateOpenApi(): Promise<void> {
  process.env.NODE_ENV = "test";
  process.env.WEB_ORIGIN ??= "http://localhost:3000";
  process.env.DATABASE_URL ??= placeholderDatabaseUrl;
  process.env.DIRECT_URL ??= placeholderDatabaseUrl;
  process.env.SHADOW_DATABASE_URL ??= "postgresql://openapi.invalid/raahsathi_shadow";

  const [{ AppModule }, { configureApplication }, { createOpenApiDocument }] = await Promise.all([
    import("../app.module"),
    import("../configure-application"),
    import("../openapi"),
  ]);
  const app = await NestFactory.create(AppModule, { logger: false });

  try {
    configureApplication(app);
    const document = createOpenApiDocument(app);
    const outputPath = resolve(__dirname, "../../../..", "docs/api/openapi.json");

    await mkdir(resolve(outputPath, ".."), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  } finally {
    await app.close();
  }
}

void generateOpenApi();

import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { configureApplication } from "./configure-application";
import { createOpenApiDocument } from "./openapi";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  configureApplication(app);
  app.enableShutdownHooks();

  if (config.get<string>("NODE_ENV", "development") !== "production") {
    const documentFactory = () => createOpenApiDocument(app);
    SwaggerModule.setup("api/docs", app, documentFactory);
  }

  const port = config.get<number>("PORT", 3001);
  await app.listen(port);
}

void bootstrap();

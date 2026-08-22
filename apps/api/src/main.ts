import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.enableCors({
    credentials: true,
    origin: config.get<string>("WEB_ORIGIN", "http://localhost:3000"),
  });
  app.enableShutdownHooks();

  if (config.get<string>("NODE_ENV", "development") !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("RaahSathi API")
      .setDescription("Independent hackathon prototype API using synthetic data only.")
      .setVersion("0.1")
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, documentFactory);
  }

  const port = config.get<number>("PORT", 3001);
  await app.listen(port);
}

void bootstrap();

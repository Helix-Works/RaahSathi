import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { INestApplication } from "@nestjs/common";

import { ApiExceptionFilter } from "./common/http/api-exception.filter";
import { correlationIdMiddleware } from "./common/http/correlation-id.middleware";

export function configureApplication(app: INestApplication): void {
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api/v1");
  app.use(correlationIdMiddleware);
  app.useGlobalFilters(new ApiExceptionFilter());
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
}


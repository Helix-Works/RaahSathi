import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { INestApplication } from "@nestjs/common";
import type { CustomOrigin } from "@nestjs/common/interfaces/external/cors-options.interface";

import { ApiExceptionFilter } from "./common/http/api-exception.filter";
import { correlationIdMiddleware } from "./common/http/correlation-id.middleware";

export function configureApplication(app: INestApplication): void {
  const config = app.get(ConfigService);
  const webOrigin = config.getOrThrow<string>("WEB_ORIGIN");
  const exactOrigin: CustomOrigin = (requestOrigin, callback) => {
    callback(null, requestOrigin === undefined || requestOrigin === webOrigin);
  };

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
    origin: exactOrigin,
  });
}

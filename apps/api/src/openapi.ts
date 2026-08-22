import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { INestApplication } from "@nestjs/common";
import type { OpenAPIObject } from "@nestjs/swagger";

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const configuration = new DocumentBuilder()
    .setTitle("RaahSathi API")
    .setDescription("Independent hackathon prototype API using synthetic data only.")
    .setVersion("0.1")
    .build();

  return SwaggerModule.createDocument(app, configuration);
}

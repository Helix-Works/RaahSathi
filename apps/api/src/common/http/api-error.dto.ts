import { ApiProperty } from "@nestjs/swagger";

export class ApiErrorDetailDto {
  @ApiProperty({ type: String, example: "DEPENDENCY_UNAVAILABLE" })
  code!: string;

  @ApiProperty({ type: String, example: "errors.dependencyUnavailable" })
  messageKey!: string;

  @ApiProperty({ type: String, example: "demo-request-123" })
  correlationId!: string;
}

export class ApiErrorDto {
  @ApiProperty({ type: () => ApiErrorDetailDto })
  error!: ApiErrorDetailDto;
}

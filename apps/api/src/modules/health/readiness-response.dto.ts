import { ApiProperty } from "@nestjs/swagger";

export class ReadinessResponseDto {
  @ApiProperty({ type: String, enum: ["ready"], example: "ready" })
  status!: "ready";

  @ApiProperty({ type: String, enum: ["up"], example: "up" })
  database!: "up";
}

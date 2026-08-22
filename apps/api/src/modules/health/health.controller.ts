import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from "@nestjs/swagger";

import { ApiErrorDto } from "../../common/http/api-error.dto";
import { PrismaService } from "../../database/prisma.service";
import { HealthResponseDto } from "./health-response.dto";
import { ReadinessResponseDto } from "./readiness-response.dto";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Check API availability" })
  @ApiOkResponse({ type: HealthResponseDto })
  check(): HealthResponseDto {
    return { status: "ok" };
  }

  @Get("ready")
  @ApiOperation({ summary: "Check whether API dependencies are ready" })
  @ApiOkResponse({ type: ReadinessResponseDto })
  @ApiServiceUnavailableResponse({ type: ApiErrorDto })
  async ready(): Promise<ReadinessResponseDto> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException();
    }

    return { status: "ready", database: "up" };
  }
}

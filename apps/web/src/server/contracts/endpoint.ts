import { z } from "zod";

export interface ResponseHeaderContract {
  componentName: string;
  description: string;
  schema: z.ZodType;
}

export interface JsonResponseContract {
  description: string;
  schemaName: string;
  schema: z.ZodType;
  headers: Record<string, ResponseHeaderContract>;
}

export interface EndpointContract {
  method: "get";
  path: string;
  operationId: string;
  summary: string;
  success: JsonResponseContract & { status: 200 };
  errors: ReadonlyArray<{ status: 500 | 503; description: string }>;
}

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
  method: "get" | "post";
  path: string;
  operationId: string;
  summary: string;
  request?: Readonly<{ schemaName: string; schema: z.ZodType }>;
  requestHeaders?: ReadonlyArray<Readonly<{ name: string; description: string; required: boolean; schema: z.ZodType }>>;
  success: (JsonResponseContract & { status: 200 | 202 }) | Readonly<{ status: 204; description: string; headers: Record<string, ResponseHeaderContract> }>;
  errors: ReadonlyArray<{ status: number; description: string; headers?: Record<string, ResponseHeaderContract> }>;
  security?: readonly "cookieAuth"[];
}

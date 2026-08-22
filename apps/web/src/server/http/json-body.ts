import { z } from "zod";

import { apiErrors } from "./api-error";

export const maximumJsonBodyBytes = 64 * 1024;

export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") throw apiErrors.unsupportedMediaType();

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maximumJsonBodyBytes) {
    throw apiErrors.tooLarge();
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maximumJsonBodyBytes) throw apiErrors.tooLarge();

  try {
    return schema.parse(JSON.parse(text));
  } catch {
    throw apiErrors.validation();
  }
}

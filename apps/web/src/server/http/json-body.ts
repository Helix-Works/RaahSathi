import { z } from "zod";

import { apiErrors } from "./api-error";

export const maximumJsonBodyBytes = 64 * 1024;

async function readBoundedText(request: Request): Promise<string> {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let byteLength = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return text + decoder.decode();

      byteLength += value.byteLength;
      if (byteLength > maximumJsonBodyBytes) {
        await reader.cancel().catch(() => undefined);
        throw apiErrors.tooLarge();
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") throw apiErrors.unsupportedMediaType();

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maximumJsonBodyBytes) {
    throw apiErrors.tooLarge();
  }

  const text = await readBoundedText(request);

  try {
    return schema.parse(JSON.parse(text));
  } catch {
    throw apiErrors.validation();
  }
}

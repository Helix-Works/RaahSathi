import { requestIdSchema } from "../contracts/health";

export function getCorrelationId(request: Request): string {
  const candidate = request.headers.get("x-request-id");
  return candidate && requestIdSchema.safeParse(candidate).success ? candidate : crypto.randomUUID();
}

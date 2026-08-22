const safeCorrelationId = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

export function getCorrelationId(request: Request): string {
  const candidate = request.headers.get("x-request-id");
  return candidate && safeCorrelationId.test(candidate) ? candidate : crypto.randomUUID();
}

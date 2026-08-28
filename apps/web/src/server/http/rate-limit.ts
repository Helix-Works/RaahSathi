import "server-only";

interface RateLimitEntry {
  count: number;
  windowStart: number;
  windowMs: number;
}

const store = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of store) {
    if (now - entry.windowStart > entry.windowMs) {
      store.delete(key);
    }
  }
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const { windowMs, maxRequests } = config;

  cleanupExpiredEntries(now);

  const existing = store.get(identifier);
  if (existing && now - existing.windowStart < existing.windowMs) {
    if (existing.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil(
        (existing.windowStart + existing.windowMs - now) / 1000,
      );
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }
    existing.count += 1;
    return {
      allowed: true,
      remaining: maxRequests - existing.count,
    };
  }

  store.set(identifier, { count: 1, windowStart: now, windowMs });
  return { allowed: true, remaining: maxRequests - 1 };
}

export const defaultReadRateLimit: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 120,
};

const perInstanceScope = `instance:${Math.random().toString(36).slice(2)}`;

function trustedClientAddress(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",").at(-1)?.trim() || undefined;
}

export function rateLimitKey(
  request: Request,
  suffix: string,
): string {
  const trustProxy = process.env.TRUST_PROXY_HEADERS === "true";
  if (trustProxy) {
    const ip = trustedClientAddress(request);
    if (ip) return `${ip}:${suffix}`;
  }
  // Without a verified connection-derived client identity, fail closed to a
  // per-instance bucket rather than trusting an attacker-controlled forwarded
  // header or an unverified session cookie a caller could rotate to bypass the
  // limit.
  return `${perInstanceScope}:${suffix}`;
}

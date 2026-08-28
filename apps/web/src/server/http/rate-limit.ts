import "server-only";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries(now: number, windowMs: number): void {
  for (const [key, entry] of store) {
    if (now - entry.windowStart > windowMs) {
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

  cleanupExpiredEntries(now, windowMs);

  const existing = store.get(identifier);
  if (existing && now - existing.windowStart <= windowMs) {
    if (existing.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil(
        (existing.windowStart + windowMs - now) / 1000,
      );
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }
    existing.count += 1;
    return {
      allowed: true,
      remaining: maxRequests - existing.count,
    };
  }

  store.set(identifier, { count: 1, windowStart: now });
  return { allowed: true, remaining: maxRequests - 1 };
}

export const defaultReadRateLimit: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 120,
};

export function rateLimitKey(
  request: Request,
  suffix: string,
): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `${ip}:${suffix}`;
}

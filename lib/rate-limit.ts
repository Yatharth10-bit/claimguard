import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();
const upstashLimiters = new Map<string, Ratelimit>();

function checkMemoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    memoryBuckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;

  const cacheKey = `${limit}:${windowMs}`;
  const cached = upstashLimiters.get(cacheKey);
  if (cached) return cached;

  const redis = Redis.fromEnv();
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(limit, `${windowSec} s`),
    prefix: "cg:rl",
    analytics: false,
  });
  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

export async function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  const upstash = getUpstashLimiter(limit, windowMs);
  if (upstash) {
    const result = await upstash.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  }

  return checkMemoryRateLimit(key, limit, windowMs);
}
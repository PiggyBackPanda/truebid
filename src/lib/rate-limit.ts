/**
 * Rate limiting using Upstash Redis (sliding window algorithm).
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
 * Falls back to allowing all requests if Redis is not configured (with a warning).
 */

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return redis;
  }
  return null;
}

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const client = getRedis();

  if (!client) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[rate-limit] Redis not configured — rate limiting is disabled. " +
          "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
      );
    }
    return { success: true, remaining: limit, resetAt: 0 };
  }

  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const key = `rl:${identifier}`;

  // Remove expired entries and count current window
  const pipeline = client.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zcard(key);
  const results = await pipeline.exec();
  const count = (results[1] as number) ?? 0;

  if (count >= limit) {
    return { success: false, remaining: 0, resetAt: now + windowSeconds * 1000 };
  }

  // Add this request
  await client.zadd(key, {
    score: now,
    member: `${now}-${Math.random().toString(36).slice(2)}`,
  });
  await client.expire(key, windowSeconds);

  return {
    success: true,
    remaining: limit - count - 1,
    resetAt: now + windowSeconds * 1000,
  };
}

/**
 * Extract the client IP from a request for use as the rate limit key.
 */
export function getClientIp(req: Request): string {
  return (
    (req.headers as Headers).get("x-forwarded-for")?.split(",")[0].trim() ??
    (req.headers as Headers).get("x-real-ip") ??
    "unknown"
  );
}

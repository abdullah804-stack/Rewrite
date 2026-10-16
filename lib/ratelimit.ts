import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Increment a counter for a key. Returns the new count.
 * TTL is applied only on first write, so daily keys expire automatically.
 */
export async function incrementWithTtl(
  key: string,
  ttlSeconds: number
): Promise<number> {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, ttlSeconds);
  }
  return count;
}

export function dailyKey(scope: string, id: string, date = new Date()): string {
  const day = date.toISOString().slice(0, 10);
  return `${scope}:${id}:${day}`;
}

export async function getCount(key: string): Promise<number> {
  const value = await redis.get<number>(key);
  return value ?? 0;
}
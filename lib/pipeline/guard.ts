import { redis, dailyKey, getCount } from "../ratelimit";

export type GuardResult =
  | { ok: true }
  | { ok: false; reason: string; retryAfterSeconds?: number };

// ---------------------------------------------------------------------------
// Step 4B: Atomic Quota Reservations (Audit §3D)
// Instead of checking then recording later (which allows race conditions),
// we reserve the quota atomically up front. If the request fails or hits cache,
// the caller refunds the reservation.
// ---------------------------------------------------------------------------

export async function reserveUserWords(
  userId: string,
  requestedWords: number,
  limit: number
): Promise<GuardResult> {
  const key = dailyKey("quota:user", userId);
  const ttl = secondsUntilMidnightUTC() + 60;

  // Atomically add the words. If the key doesn't exist, it creates it at `requestedWords`.
  const newTotal = await redis.incrby(key, requestedWords);

  // If this was the first time creating the key, set the expiration
  if (newTotal === requestedWords) {
    await redis.expire(key, ttl);
  }

  // If the new total exceeds the limit, we immediately roll back the addition
  if (newTotal > limit) {
    await redis.decrby(key, requestedWords);
    const used = await getCount(key);
    
    return {
      ok: false,
      reason: `Daily limit reached (${used}/${limit} words used). Sign in tomorrow or bring your own key.`,
      retryAfterSeconds: secondsUntilMidnightUTC(),
    };
  }

  return { ok: true };
}

export async function refundUserWords(
  userId: string,
  words: number
): Promise<void> {
  if (words <= 0) return;
  const key = dailyKey("quota:user", userId);
  await redis.decrby(key, words).catch(() => {});
}

export async function reserveAnonRun(
  ip: string,
  limit: number
): Promise<GuardResult> {
  const key = dailyKey("quota:anon", ip);
  const ttl = secondsUntilMidnightUTC() + 60;

  const newTotal = await redis.incrby(key, 1);

  if (newTotal === 1) {
    await redis.expire(key, ttl);
  }

  if (newTotal > limit) {
    await redis.decrby(key, 1);
    return {
      ok: false,
      reason: `Anonymous limit reached (${limit}/day). Sign in for more.`,
      retryAfterSeconds: secondsUntilMidnightUTC(),
    };
  }

  return { ok: true };
}

export async function refundAnonRun(ip: string): Promise<void> {
  const key = dailyKey("quota:anon", ip);
  await redis.decrby(key, 1).catch(() => {});
}

// ---------------------------------------------------------------------------
// Provider Capacity (Global circuit breaker)
// ---------------------------------------------------------------------------

export async function checkProviderCapacity(
  providerId: string,
  dailyLimit: number
): Promise<GuardResult> {
  const key = dailyKey("capacity:provider", providerId);
  const used = await getCount(key);

  if (used >= dailyLimit) {
    return {
      ok: false,
      reason: `Provider ${providerId} at capacity (${used}/${dailyLimit}).`,
      retryAfterSeconds: secondsUntilMidnightUTC(),
    };
  }

  return { ok: true };
}

export async function recordProviderCall(
  providerId: string
): Promise<void> {
  const key = dailyKey("capacity:provider", providerId);
  const ttl = secondsUntilMidnightUTC() + 60;
  const newTotal = await redis.incr(key);
  if (newTotal === 1) {
    await redis.expire(key, ttl);
  }
}

function secondsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

/** Extract a best-effort client IP from request headers. */
export function clientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
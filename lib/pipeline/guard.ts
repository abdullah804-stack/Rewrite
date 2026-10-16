import { redis, incrementWithTtl, dailyKey, getCount } from "../ratelimit";

export type GuardResult =
  | { ok: true }
  | { ok: false; reason: string; retryAfterSeconds?: number };

/** Per-user daily rewrite word budget (signed-in users). */
export async function checkUserWordBudget(
  userId: string,
  requestedWords: number,
  limit: number
): Promise<GuardResult> {
  const key = dailyKey("quota:user", userId);
  const used = await getCount(key);

  if (used + requestedWords > limit) {
    return {
      ok: false,
      reason: `Daily limit reached (${used}/${limit} words used). Sign in tomorrow or bring your own key.`,
      retryAfterSeconds: secondsUntilMidnightUTC(),
    };
  }

  return { ok: true };
}

export async function recordUserWords(
  userId: string,
  words: number
): Promise<void> {
  const key = dailyKey("quota:user", userId);
  await incrementWithTtl(key, secondsUntilMidnightUTC() + 60);
  await redis.incrby(key, words - 1);
}

/** Anonymous per-IP request count. */
export async function checkAnonRunBudget(
  ip: string,
  limit: number
): Promise<GuardResult> {
  const key = dailyKey("quota:anon", ip);
  const used = await getCount(key);

  if (used >= limit) {
    return {
      ok: false,
      reason: `Anonymous limit reached (${limit}/day). Sign in for more.`,
      retryAfterSeconds: secondsUntilMidnightUTC(),
    };
  }

  return { ok: true };
}

export async function recordAnonRun(ip: string): Promise<void> {
  const key = dailyKey("quota:anon", ip);
  await incrementWithTtl(key, secondsUntilMidnightUTC() + 60);
}

/** Global circuit breaker — track per-provider call counts. */
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
  await incrementWithTtl(key, secondsUntilMidnightUTC() + 60);
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
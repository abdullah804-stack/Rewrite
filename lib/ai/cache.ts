import { redis } from "../ratelimit";
import { createHash } from "crypto";

export function hashRequest(
  text: string,
  intensity: string,
  profileId: string | null,
  preset: string,
  seoSafe: boolean,
  formality: number,
  directness: number
): string {
  const payload = JSON.stringify({
    text,
    intensity,
    profileId,
    preset,
    seoSafe,
    formality,
    directness,
  });
  return createHash("sha256").update(payload).digest("hex");
}

export async function getCachedResponse<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get<string>(`cache:rewrite:${key}`);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  } catch {
    return null;
  }
}

export async function setCachedResponse<T>(key: string, data: T): Promise<void> {
  try {
    // Cache for 24 hours
    await redis.set(`cache:rewrite:${key}`, JSON.stringify(data), { ex: 86400 });
  } catch {
    // ignore cache failures
  }
}
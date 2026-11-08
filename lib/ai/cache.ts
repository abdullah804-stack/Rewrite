import { redis } from "../ratelimit";
import { createHash } from "crypto";

// Step 16: Accepts promptVersion as the first argument to invalidate
// the cache when prompts change.
export function hashRequest(
  promptVersion: string,
  text: string,
  intensity: string,
  profileId: string | null,
  preset: string,
  seoSafe: boolean,
  formality: number,
  directness: number,
  glossaryHash: string | null,
  modelName: string
): string {
  const payload = JSON.stringify({
    v: promptVersion,
    text,
    intensity,
    profileId,
    preset,
    seoSafe,
    formality,
    directness,
    glossaryHash,
    modelName,
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
    await redis.set(`cache:rewrite:${key}`, JSON.stringify(data), { ex: 86400 });
  } catch {
    // ignore cache failures
  }
}
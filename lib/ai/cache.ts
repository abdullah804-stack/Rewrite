import { redis } from "../ratelimit";
import { createHash } from "crypto";

// Step 4A: Cache-Key fix (Audit §3B)
// We now hash the *effective* glossary rules and the model name.
// This prevents Project A's rules from leaking into Project B's rewrite,
// and prevents mixing outputs from different models (e.g., Groq vs OpenRouter).
export function hashRequest(
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
  // Bump this if the prompt or protection logic changes drastically,
  // to force fresh generations and avoid serving stale text.
  const CACHE_VERSION = "v2";

  const payload = JSON.stringify({
    v: CACHE_VERSION,
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
    // Cache for 24 hours
    await redis.set(`cache:rewrite:${key}`, JSON.stringify(data), { ex: 86400 });
  } catch {
    // ignore cache failures
  }
}
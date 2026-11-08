export type ProviderId = "google" | "groq" | "openrouter" | "cloudflare";

export type ProviderConfig = {
  id: ProviderId;
  name: string;
  baseUrl: string;
  model: string;
  envKey: string;
  trainsOnPrompts: boolean | "unknown";
  needsAccountId?: boolean;
  apiShape: "openai" | "google" | "cloudflare";
};

// Order matters for reading, not for routing.
// The actual fallback order lives in chatWithFallback() in chat.ts.
//
// Eval results (Step 2, 2026-11-06):
//   groq       6/15 success · 2.3s avg · protected spans 6/6  → PRIMARY (quota-limited)
//   openrouter 15/15 success · 29s avg · protected spans 14/15 → SAFETY NET (now pinned)
//   google     0/15 success · free tier is 20 req/day → UNUSABLE
//   cloudflare 15/15 success · 1.1s avg · protected spans 13/15 → UNSAFE (reorders spans)
//
// Step 3 change: openrouter no longer uses "openrouter/free" (a random routing
// alias that changes the underlying model per request). It is now pinned to
// Nemotron 3 Ultra (free), NVIDIA's 550B/55B-active frontier reasoning model.
// This makes the OpenRouter fallback deterministic, and makes the cache key
// safe to include a model field in Step 4.
export const providers: ProviderConfig[] = [
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "openai/gpt-oss-120b",
    envKey: "GROQ_API_KEY",
    trainsOnPrompts: false,
    apiShape: "openai",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    envKey: "OPENROUTER_API_KEY",
    trainsOnPrompts: "unknown",
    apiShape: "openai",
  },
  // Google free tier: 20 requests/day. Not usable as a fallback.
  // Kept in registry for future testing only. Not in the chain.
  {
    id: "google",
    name: "Google AI Studio",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-3.8-flash",
    envKey: "GOOGLE_AI_KEY",
    trainsOnPrompts: true,
    apiShape: "google",
  },
  // Cloudflare drops protected spans 2 out of 15 times after Step 2.
  // Unsafe. Kept in registry for future testing only. Not in the chain.
  {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    baseUrl: "https://api.cloudflare.com/client/v4/accounts",
    model: "@cf/meta/llama-3.1-8b-instruct",
    envKey: "CLOUDFLARE_AI_TOKEN",
    trainsOnPrompts: false,
    needsAccountId: true,
    apiShape: "cloudflare",
  },
];

export function getProvider(id: ProviderId): ProviderConfig {
  const provider = providers.find((p) => p.id === id);
  if (!provider) throw new Error(`Unknown provider: ${id}`);
  return provider;
}
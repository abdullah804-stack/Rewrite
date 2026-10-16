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
// Eval results (9 fixtures, 2026-10-16):
//   groq       7/9 success · 3.1s avg · protected spans 7/7  → PRIMARY
//   openrouter 9/9 success · 31s avg  · protected spans 9/9  → SAFETY NET
//   google     0/9 success · free tier is 5 req/min per model → UNUSABLE
//   cloudflare 9/9 success · 2.2s avg · protected spans 2/9  → UNSAFE
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
    model: "openrouter/free",
    envKey: "OPENROUTER_API_KEY",
    trainsOnPrompts: "unknown",
    apiShape: "openai",
  },
  // Google free tier: 5 requests/min per model. Not usable as a fallback.
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
  // Cloudflare drops protected spans 7 out of 9 times. Unsafe.
  // Kept in registry for future testing only. Not in the chain.
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
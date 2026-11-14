export type ProviderId = "deepseek" | "google" | "groq" | "openrouter" | "cloudflare";

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
export const providers: ProviderConfig[] = [
  {
    id: "deepseek",
    name: "DeepSeek (TokenLab)",
    baseUrl: "https://api.tokenlab.amd.com/v1",
    model: "DeepSeek-V4.1-Flash",
    envKey: "DEEPSEEK_API_KEY",
    trainsOnPrompts: "unknown",
    apiShape: "openai",
  },
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
  {
    id: "google",
    name: "Google AI Studio",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-3.8-flash",
    envKey: "GOOGLE_AI_KEY",
    trainsOnPrompts: true,
    apiShape: "google",
  },
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
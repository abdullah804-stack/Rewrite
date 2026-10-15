export type ProviderId = "google" | "groq" | "openrouter" | "cloudflare";

export type ProviderConfig = {
  id: ProviderId;
  name: string;
  baseUrl: string;
  model: string;
  envKey: string;
  trainsOnPrompts: boolean | "unknown";
  needsAccountId?: boolean;
};

export const providers: ProviderConfig[] = [
  {
    id: "google",
    name: "Google AI Studio",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-2.0-flash",
    envKey: "GOOGLE_AI_KEY",
    trainsOnPrompts: true,
  },
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    envKey: "GROQ_API_KEY",
    trainsOnPrompts: false,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openrouter/free",
    envKey: "OPENROUTER_API_KEY",
    trainsOnPrompts: "unknown",
  },
  {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    baseUrl: "https://api.cloudflare.com/client/v4/accounts",
    model: "@cf/meta/llama-3.1-8b-instruct",
    envKey: "CLOUDFLARE_AI_TOKEN",
    trainsOnPrompts: false,
    needsAccountId: true,
  },
];

export function getProvider(id: ProviderId): ProviderConfig {
  const provider = providers.find((p) => p.id === id);
  if (!provider) throw new Error(`Unknown provider: ${id}`);
  return provider;
}
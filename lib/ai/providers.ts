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

// Order here matters for reading, not for routing.
// The routing order comes from getProviderOrder() below.
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

// DeepSeek first, then the free tiers as fallbacks.
export const DEFAULT_PROVIDER_ORDER: ProviderId[] = ["deepseek", "groq", "openrouter"];

/**
 * The order providers are tried in. Override with the AI_PROVIDER_ORDER env var,
 * for example "deepseek" (never fall back) or "groq,openrouter".
 * Unknown names are ignored with a warning. An empty or fully invalid value gives the default.
 */
export function getProviderOrder(raw: string | undefined = process.env.AI_PROVIDER_ORDER): ProviderId[] {
  if (!raw || !raw.trim()) return DEFAULT_PROVIDER_ORDER;
  const names = raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const valid: ProviderId[] = [];
  for (const name of names) {
    const match = providers.find((p) => p.id === name);
    if (!match) { console.warn(`[ai] AI_PROVIDER_ORDER: unknown provider "${name}" ignored`); continue; }
    if (!valid.includes(match.id)) valid.push(match.id);
  }
  return valid.length ? valid : DEFAULT_PROVIDER_ORDER;
}

/** True when the provider's API key is present in the environment. */
export function hasApiKey(id: ProviderId): boolean {
  return !!process.env[getProvider(id).envKey];
}
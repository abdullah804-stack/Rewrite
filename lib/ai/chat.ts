import { getProvider, getProviderOrder, hasApiKey, type ProviderId, type ProviderConfig } from "./providers";

export type ChatOptions = {
  providerId: ProviderId;
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;              // NEW
  frequencyPenalty?: number;  // NEW
  presencePenalty?: number;   // NEW
  /** Abort the request after this many ms so a hung provider cannot eat the whole route budget. */
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 25_000;
const signalFor = (opts: { timeoutMs?: number }) => AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

export type ChatResult = {
  text: string;
  provider: string;
  model: string;
  /** Machine id of the provider that answered, for pinning follow-up calls to the same model. */
  providerId: ProviderId;
  /** Providers that were tried first and failed, with a short reason. Only set after a fallback. */
  fellBackFrom?: string[];
};

// Providers known to accept frequency/presence penalties on /chat/completions.
// Groq is left out on purpose: unsupported params can make requests fail.
const PENALTY_PROVIDERS = new Set<string>(["deepseek", "openrouter"]);

function samplingParams(provider: ProviderConfig, opts: Omit<ChatOptions, "providerId">) {
  const p: Record<string, number> = {};
  if (opts.topP !== undefined) p.top_p = opts.topP;
  if (PENALTY_PROVIDERS.has(provider.id)) {
    if (opts.frequencyPenalty !== undefined) p.frequency_penalty = opts.frequencyPenalty;
    if (opts.presencePenalty !== undefined) p.presence_penalty = opts.presencePenalty;
  }
  return p;
}

export async function chat(opts: ChatOptions): Promise<ChatResult> {
  const provider = getProvider(opts.providerId);
  const apiKey = process.env[provider.envKey];

  if (!apiKey) {
    throw new Error(`Missing API key for ${provider.name} (${provider.envKey})`);
  }

  if (provider.apiShape === "google") {
    return chatGoogle(provider, apiKey, opts);
  }

  if (provider.apiShape === "cloudflare") {
    return chatCloudflare(provider, apiKey, opts);
  }

  return chatOpenAICompatible(provider, apiKey, opts);
}

async function chatGoogle(provider: ProviderConfig, apiKey: string, opts: ChatOptions): Promise<ChatResult> {
  const url = `${provider.baseUrl}/models/${provider.model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: signalFor(opts),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: [{ text: opts.user }] }],
      generationConfig: {
        maxOutputTokens: opts.maxTokens ?? 2000,
        temperature: opts.temperature ?? 0.7,
        ...(opts.topP !== undefined ? { topP: opts.topP } : {}),
      },
    }),
  });
  if (!response.ok) throw new Error(`Google AI error: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || text.length === 0) throw new Error("Google AI returned an empty response.");
  return { text, provider: provider.name, model: provider.model, providerId: provider.id };
}

async function chatCloudflare(provider: ProviderConfig, apiKey: string, opts: ChatOptions): Promise<ChatResult> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!accountId) throw new Error("Missing CLOUDFLARE_ACCOUNT_ID");
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${provider.model}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    signal: signalFor(opts),
    body: JSON.stringify({
      messages: [{ role: "system", content: opts.system }, { role: "user", content: opts.user }],
      max_tokens: opts.maxTokens ?? 2000, temperature: opts.temperature ?? 0.7,
    }),
  });
  if (!response.ok) throw new Error(`Cloudflare Workers AI error: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const text = extractCloudflareText(data);
  if (!text) throw new Error(`Cloudflare returned an unrecognized shape.`);
  return { text, provider: provider.name, model: provider.model, providerId: provider.id };
}

function extractCloudflareText(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const result = obj.result;
  if (typeof result === "string" && result.length > 0) return result;
  if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    if (typeof r.response === "string" && r.response.length > 0) return r.response;
    const choices = r.choices;
    if (Array.isArray(choices) && choices.length > 0) {
      const first = choices[0] as Record<string, unknown>;
      const message = first?.message as Record<string, unknown> | undefined;
      if (message && typeof message.content === "string") return message.content;
      if (typeof first?.text === "string") return first.text;
    }
    if (typeof r.text === "string" && r.text.length > 0) return r.text;
  }
  return null;
}

async function chatOpenAICompatible(provider: ProviderConfig, apiKey: string, opts: ChatOptions): Promise<ChatResult> {
  const url = `${provider.baseUrl}/chat/completions`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const body: any = {
      model: provider.model,
      messages: [{ role: "system", content: opts.system }, { role: "user", content: opts.user }],
      max_tokens: opts.maxTokens ?? 2000,
      temperature: opts.temperature ?? 0.7,
      ...samplingParams(provider, opts),
    };

    // ONLY enforce json_object format if we are NOT using DeepSeek (TokenLab breaks on it)
    if (provider.id !== "deepseek") {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: signalFor(opts),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      if (response.status >= 500 && attempt < 2) { await sleep(800); continue; }
      throw new Error(`${provider.name} error: ${response.status} ${error}`);
    }

    const raw = await response.text();
    if (!raw || raw.trim().length === 0) { if (attempt < 2) { await sleep(800); continue; } throw new Error(`${provider.name} returned empty.`); }

    let data: { choices?: { message?: { content?: string } }[] };
    try { data = JSON.parse(raw); } catch { throw new Error(`${provider.name} returned non-JSON.`); }

    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.length === 0) { if (attempt < 2) { await sleep(800); continue; } throw new Error(`${provider.name} returned empty.`); }

    return { text, provider: provider.name, model: provider.model, providerId: provider.id };
  }
  throw new Error(`${provider.name} failed after retries.`);
}

function sleep(ms: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, ms)); }

const OPENROUTER_SECONDARY_MODEL = "google/gemma-4-31b-it:free";

/**
 * Tries providers in order. The default order comes from getProviderOrder()
 * (DeepSeek, then Groq, then OpenRouter; override with AI_PROVIDER_ORDER).
 * Pass a single-element array to pin a call to one provider with no fallback.
 */
export async function chatWithFallback(
  opts: Omit<ChatOptions, "providerId">,
  order: ProviderId[] = getProviderOrder()
): Promise<ChatResult> {
  let lastError: Error | null = null;
  const failures: string[] = [];
  const noteFailure = (id: string, err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`${id}: ${msg.slice(0, 120)}`);
    console.warn(`[ai] ${id} failed, trying next provider: ${msg.slice(0, 200)}`);
  };

  for (const providerId of order) {
    if (!hasApiKey(providerId)) {
      failures.push(`${providerId}: no API key`);
      lastError = new Error(`Missing API key for ${getProvider(providerId).name} (${getProvider(providerId).envKey})`);
      continue;
    }
    try {
      const result = await chat({ ...opts, providerId });
      return failures.length ? { ...result, fellBackFrom: failures } : result;
    } catch (err) {
      lastError = err as Error;
      noteFailure(providerId, err);
      if (providerId === "openrouter") {
        try {
          const provider = getProvider("openrouter");
          const apiKey = process.env[provider.envKey];
          if (!apiKey) throw new Error("Missing OpenRouter API key");
          const result = await chatOpenAICompatibleWithModel(provider, apiKey, OPENROUTER_SECONDARY_MODEL, opts);
          return { ...result, fellBackFrom: failures };
        } catch (secondaryErr) {
          lastError = secondaryErr as Error;
          noteFailure("openrouter-secondary", secondaryErr);
        }
      }
    }
  }
  const detail = failures.length ? ` (${failures.join("; ")})` : "";
  throw new Error(`${lastError?.message ?? "All providers failed"}${detail}`);
}

async function chatOpenAICompatibleWithModel(provider: ProviderConfig, apiKey: string, model: string, opts: Omit<ChatOptions, "providerId">): Promise<ChatResult> {
  const url = `${provider.baseUrl}/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    signal: signalFor(opts),
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: opts.system }, { role: "user", content: opts.user }],
      max_tokens: opts.maxTokens ?? 2000,
      temperature: opts.temperature ?? 0.7,
      ...samplingParams(provider, opts),
      response_format: { type: "json_object" },
    }),
  });
  if (!response.ok) throw new Error(`${provider.name} error: ${response.status} ${await response.text()}`);
  const raw = await response.text();
  let data: { choices?: { message?: { content?: string } }[] };
  try { data = JSON.parse(raw); } catch { throw new Error(`${provider.name} returned non-JSON.`); }
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || text.length === 0) throw new Error(`${provider.name} returned empty.`);
  return { text, provider: provider.name, model, providerId: provider.id };
}
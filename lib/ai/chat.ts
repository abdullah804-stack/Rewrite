import { getProvider, type ProviderId, type ProviderConfig } from "./providers";

export type ChatOptions = {
  providerId: ProviderId;
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
};

export type ChatResult = {
  text: string;
  provider: string;
  model: string;
};

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

async function chatGoogle(
  provider: ProviderConfig,
  apiKey: string,
  opts: ChatOptions
): Promise<ChatResult> {
  const url = `${provider.baseUrl}/models/${provider.model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: [{ text: opts.user }] }],
      generationConfig: {
        maxOutputTokens: opts.maxTokens ?? 2000,
        temperature: opts.temperature ?? 0.7,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google AI error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== "string" || text.length === 0) {
    throw new Error("Google AI returned an empty response.");
  }

  return { text, provider: provider.name, model: provider.model };
}

async function chatCloudflare(
  provider: ProviderConfig,
  apiKey: string,
  opts: ChatOptions
): Promise<ChatResult> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!accountId) {
    throw new Error("Missing CLOUDFLARE_ACCOUNT_ID");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${provider.model}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      max_tokens: opts.maxTokens ?? 2000,
      temperature: opts.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudflare Workers AI error: ${response.status} ${error}`);
  }

  const data = await response.json();

  const text = extractCloudflareText(data);
  if (!text) {
    throw new Error(
      `Cloudflare returned an unrecognized shape: ${JSON.stringify(data).slice(0, 300)}`
    );
  }

  return { text, provider: provider.name, model: provider.model };
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

async function chatOpenAICompatible(
  provider: ProviderConfig,
  apiKey: string,
  opts: ChatOptions
): Promise<ChatResult> {
  const url = `${provider.baseUrl}/chat/completions`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        max_tokens: opts.maxTokens ?? 2000,
        temperature: opts.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      if (response.status >= 500 && attempt < 2) {
        await sleep(800);
        continue;
      }
      throw new Error(`${provider.name} error: ${response.status} ${error}`);
    }

    const raw = await response.text();

    if (!raw || raw.trim().length === 0) {
      if (attempt < 2) {
        await sleep(800);
        continue;
      }
      throw new Error(`${provider.name} returned an empty response body.`);
    }

    let data: { choices?: { message?: { content?: string } }[] };
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(
        `${provider.name} returned non-JSON response: ${raw.slice(0, 200)}`
      );
    }

    const text = data?.choices?.[0]?.message?.content;

    if (typeof text !== "string" || text.length === 0) {
      if (attempt < 2) {
        await sleep(800);
        continue;
      }
      throw new Error(`${provider.name} returned an empty response.`);
    }

    return { text, provider: provider.name, model: provider.model };
  }

  throw new Error(`${provider.name} failed after retries.`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Provider chain is fixed by evaluation results, not guesses.
// Eval (9 fixtures, 2026-10-16):
//   - groq: 7/9 success, 3.1s avg, protected spans 7/7. PRIMARY.
//   - openrouter: 9/9 success, 31s avg, protected spans 9/9. SAFETY NET.
//   - google: free tier is 5 req/min per model — unusable at real traffic.
//   - cloudflare: dropped protected spans 7/9 times — unsafe.
//
// The chain falls through on ANY thrown error. That includes 429 rate
// limits, 5xx server errors, empty responses, and JSON parse failures.
export async function chatWithFallback(
  opts: Omit<ChatOptions, "providerId">,
  order: ProviderId[] = ["groq", "openrouter"]
): Promise<ChatResult> {
  let lastError: Error | null = null;

  for (const providerId of order) {
    try {
      return await chat({ ...opts, providerId });
    } catch (err) {
      lastError = err as Error;
      continue;
    }
  }

  throw lastError ?? new Error("All providers failed");
}
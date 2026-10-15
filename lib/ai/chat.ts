import { providers, getProvider, type ProviderId } from "./providers";

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

  if (provider.id === "google") {
    return chatGoogle(provider, apiKey, opts);
  }

  // Groq and OpenRouter use OpenAI-compatible format
  return chatOpenAICompatible(provider, apiKey, opts);
}

async function chatGoogle(
  provider: ReturnType<typeof getProvider>,
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
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  return { text, provider: provider.name, model: provider.model };
}

async function chatOpenAICompatible(
  provider: ReturnType<typeof getProvider>,
  apiKey: string,
  opts: ChatOptions
): Promise<ChatResult> {
  const url = `${provider.baseUrl}/chat/completions`;

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
    throw new Error(`${provider.name} error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "";

  return { text, provider: provider.name, model: provider.model };
}

export async function chatWithFallback(
  opts: Omit<ChatOptions, "providerId">,
  order: ProviderId[] = ["groq", "google", "openrouter"]
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
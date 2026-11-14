import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { chatWithFallback } from "../chat";

const ok = (text = '{"text":"hi"}') =>
  new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), { status: 200 });
const bad = () => new Response("nope", { status: 400 }); // 4xx so the provider does not retry internally

let fetchMock: ReturnType<typeof vi.fn>;
const calledHosts = () => fetchMock.mock.calls.map((c) => new URL(String(c[0])).host);

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("DEEPSEEK_API_KEY", "k-deepseek");
  vi.stubEnv("GROQ_API_KEY", "k-groq");
  vi.stubEnv("OPENROUTER_API_KEY", "k-openrouter");
  vi.stubEnv("AI_PROVIDER_ORDER", "");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("chatWithFallback", () => {
  it("uses DeepSeek first by default", async () => {
    fetchMock.mockResolvedValueOnce(ok());
    const r = await chatWithFallback({ system: "s", user: "u" });
    expect(r.providerId).toBe("deepseek");
    expect(r.fellBackFrom).toBeUndefined();
    expect(calledHosts()).toEqual(["api.tokenlab.amd.com"]);
  });

  it("does not send response_format to DeepSeek but does send penalties", async () => {
    fetchMock.mockResolvedValueOnce(ok());
    await chatWithFallback({ system: "s", user: "u", frequencyPenalty: 0.4, topP: 0.95 });
    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body.response_format).toBeUndefined();
    expect(body.frequency_penalty).toBe(0.4);
    expect(body.top_p).toBe(0.95);
  });

  it("falls back to Groq when DeepSeek fails and reports it", async () => {
    fetchMock.mockResolvedValueOnce(bad()).mockResolvedValueOnce(ok());
    const r = await chatWithFallback({ system: "s", user: "u" });
    expect(r.providerId).toBe("groq");
    expect(r.fellBackFrom?.[0]).toMatch(/^deepseek:/);
    expect(calledHosts()).toEqual(["api.tokenlab.amd.com", "api.groq.com"]);
  });

  it("falls back when the request times out", async () => {
    fetchMock
      .mockRejectedValueOnce(new DOMException("The operation timed out", "TimeoutError"))
      .mockResolvedValueOnce(ok());
    const r = await chatWithFallback({ system: "s", user: "u" });
    expect(r.providerId).toBe("groq");
  });

  it("passes an abort signal so requests cannot hang", async () => {
    fetchMock.mockResolvedValueOnce(ok());
    await chatWithFallback({ system: "s", user: "u" });
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("skips a provider with no API key without calling it", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    fetchMock.mockResolvedValueOnce(ok());
    const r = await chatWithFallback({ system: "s", user: "u" });
    expect(r.providerId).toBe("groq");
    expect(r.fellBackFrom).toEqual(["deepseek: no API key"]);
    expect(calledHosts()).toEqual(["api.groq.com"]);
  });

  it("respects AI_PROVIDER_ORDER", async () => {
    vi.stubEnv("AI_PROVIDER_ORDER", "groq");
    fetchMock.mockResolvedValueOnce(ok());
    const r = await chatWithFallback({ system: "s", user: "u" });
    expect(r.providerId).toBe("groq");
    expect(calledHosts()).toEqual(["api.groq.com"]);
  });

  it("a pinned single provider never falls back", async () => {
    fetchMock.mockResolvedValue(bad());
    await expect(chatWithFallback({ system: "s", user: "u" }, ["deepseek"])).rejects.toThrow();
    expect(calledHosts()).toEqual(["api.tokenlab.amd.com"]);
  });

  it("explains every failure when all providers fail", async () => {
    fetchMock.mockResolvedValue(bad());
    await expect(chatWithFallback({ system: "s", user: "u" })).rejects.toThrow(/deepseek:.*groq:/s);
  });
});

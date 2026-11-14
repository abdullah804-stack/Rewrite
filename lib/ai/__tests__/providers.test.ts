import { describe, it, expect, vi, afterEach } from "vitest";
import { DEFAULT_PROVIDER_ORDER, getProviderOrder } from "../providers";

afterEach(() => vi.restoreAllMocks());

describe("getProviderOrder", () => {
  it("defaults to deepseek, groq, openrouter", () => {
    expect(DEFAULT_PROVIDER_ORDER).toEqual(["deepseek", "groq", "openrouter"]);
    expect(getProviderOrder(undefined)).toEqual(DEFAULT_PROVIDER_ORDER);
    expect(getProviderOrder("")).toEqual(DEFAULT_PROVIDER_ORDER);
    expect(getProviderOrder("   ")).toEqual(DEFAULT_PROVIDER_ORDER);
  });

  it("accepts an override, ignoring case and spaces", () => {
    expect(getProviderOrder("Groq, OpenRouter")).toEqual(["groq", "openrouter"]);
    expect(getProviderOrder("deepseek")).toEqual(["deepseek"]);
  });

  it("drops duplicates and unknown names", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(getProviderOrder("groq,groq,nonsense,deepseek")).toEqual(["groq", "deepseek"]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("falls back to the default when nothing valid is left", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(getProviderOrder("nonsense")).toEqual(DEFAULT_PROVIDER_ORDER);
  });
});

import { describe, it, expect } from "vitest";
import { protect, restore, verifySpans } from "../protect";

describe("protect", () => {
  it("masks a URL", () => {
    const { masked, spans } = protect("Visit https://example.com for more.");
    expect(masked).toBe("Visit ⟦P1⟧ for more.");
    expect(spans[0].kind).toBe("url");
    expect(spans[0].original).toBe("https://example.com");
  });

  it("masks an email", () => {
    const { masked } = protect("Contact me at hi@example.com today.");
    expect(masked).toContain("⟦P1⟧");
    expect(masked).not.toContain("hi@example.com");
  });

    it("masks a percent", () => {
    const { masked, spans } = protect("We grew 42% last year.");
    expect(masked).toContain("⟦P1⟧");
    expect(spans.length).toBe(1);
    expect(spans[0].kind).toBe("percent");
    expect(spans[0].original).toBe("42%");
  });

  it("masks multiple numbers", () => {
    const { masked, spans } = protect("We grew 42 and 17 was the year.");
    expect(masked).toContain("⟦P1⟧");
    expect(masked).toContain("⟦P2⟧");
    expect(spans.length).toBe(2);
  });

  it("masks years", () => {
    const { masked, spans } = protect("Founded in 2018, we shipped in 2024.");
    expect(spans.filter((s) => s.kind === "year").length).toBe(2);
    expect(masked).not.toContain("2018");
    expect(masked).not.toContain("2024");
  });

  it("masks quoted text", () => {
    const { masked } = protect('She said "hello world" and left.');
    expect(masked).toContain("⟦P1⟧");
    expect(masked).not.toContain("hello world");
  });

  it("prefers longest match at same position", () => {
    const { spans } = protect("Revenue was $5 million.");
    expect(spans[0].kind).toBe("currency");
    expect(spans[0].original).toBe("$5 million");
  });

  it("handles empty input", () => {
    const { masked, spans } = protect("");
    expect(masked).toBe("");
    expect(spans).toEqual([]);
  });
});

describe("restore", () => {
  it("puts original values back", () => {
    const input = "Visit https://example.com and pay $50.";
    const { masked, spans } = protect(input);
    const restored = restore(masked, spans);
    expect(restored).toBe(input);
  });

  it("restores even if the token order changes", () => {
    const input = "Price $50, year 2024.";
    const { masked, spans } = protect(input);
    const reordered = masked.replace("⟦P1⟧", "⟦P2⟧").replace("⟦P2⟧", "⟦P1⟧");
    const restored = restore(reordered, spans);
    expect(restored).toContain("$50");
    expect(restored).toContain("2024");
  });
});

describe("verifySpans", () => {
  it("detects missing spans", () => {
    const { spans } = protect("Visit https://example.com.");
    const result = verifySpans("Visit somewhere.", spans);
    expect(result.ok).toBe(false);
    expect(result.missing.length).toBe(1);
  });

  it("passes when spans present", () => {
    const { masked, spans } = protect("Visit https://example.com.");
    const result = verifySpans(masked, spans);
    expect(result.ok).toBe(true);
  });
});
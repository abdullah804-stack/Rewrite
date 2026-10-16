import { describe, it, expect } from "vitest";
import { lint } from "../lint";
import { suggestFix, applyFix, applyAllFixes } from "../fixes";

describe("suggestFix", () => {
  it("returns a replacement for a replaceable phrase", () => {
    const hit = lint("Leverage the platform.").hits[0];
    const suggestion = suggestFix(hit);
    expect(suggestion.replacement).toBe("use");
    expect(suggestion.display).toBe("use");
  });

  it("returns Remove for a delete-only phrase", () => {
    const hit = lint("It is important to note that we should go.").hits[0];
    const suggestion = suggestFix(hit);
    expect(suggestion.replacement).toBeNull();
    expect(suggestion.display).toBe("Remove");
  });
});

describe("applyFix", () => {
    it("replaces a phrase and preserves capitalization at sentence start", () => {
    const text = "Leverage the platform.";
    const hit = lint(text).hits[0];
    const result = applyFix(text, hit, "use");
    expect(result).toBe("Use the platform.");
  });

  it("replaces a phrase in lowercase when the original was lowercase", () => {
    const text = "We leverage the platform.";
    const hit = lint(text).hits[0];
    const result = applyFix(text, hit, "use");
    expect(result).toBe("We use the platform.");
  });

  it("removes a phrase cleanly", () => {
    const text = "It is important to note that we should go.";
    const hit = lint(text).hits[0];
    const result = applyFix(text, hit, null);
    expect(result).not.toContain("important");
    expect(result).toContain("we should go");
  });
});

describe("applyAllFixes", () => {
  it("fixes multiple phrases at once", () => {
    const text = "Leverage the synergy and delve into the details.";
    const { result, appliedCount } = applyAllFixes(text);
    expect(appliedCount).toBeGreaterThanOrEqual(2);
    expect(result).not.toContain("Leverage");
    expect(result).not.toContain("delve into");
  });

  it("returns the original for clean text", () => {
    const text = "The cat sat on the mat.";
    const { result, appliedCount } = applyAllFixes(text);
    expect(appliedCount).toBe(0);
    expect(result).toBe(text);
  });

  it("handles overlapping phrases without breaking", () => {
    const text = "In today's fast-paced world, it is important to note that we adapt.";
    const { result } = applyAllFixes(text);
    expect(result.length).toBeGreaterThan(0);
  });
});
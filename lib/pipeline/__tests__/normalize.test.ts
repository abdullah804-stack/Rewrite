import { describe, it, expect } from "vitest";
import { normalize, countWords } from "../normalize";

describe("normalize", () => {
  it("collapses multiple spaces", () => {
    const result = normalize("hello    world");
    expect(result.normalized).toBe("hello world");
  });

  it("converts windows newlines", () => {
    const result = normalize("line one\r\nline two");
    expect(result.normalized).toBe("line one\nline two");
  });

  it("splits into paragraphs on blank lines", () => {
    const result = normalize("para one\n\npara two\n\npara three");
    expect(result.paragraphs).toEqual(["para one", "para two", "para three"]);
  });

  it("collapses three or more newlines to two", () => {
    const result = normalize("a\n\n\n\nb");
    expect(result.normalized).toBe("a\n\nb");
  });

  it("trims leading and trailing whitespace", () => {
    const result = normalize("  hello  ");
    expect(result.normalized).toBe("hello");
  });

  it("handles empty input", () => {
    const result = normalize("");
    expect(result.normalized).toBe("");
    expect(result.paragraphs).toEqual([]);
  });
});

describe("countWords", () => {
  it("counts simple words", () => {
    expect(countWords("hello world")).toBe(2);
  });

  it("handles multiple spaces", () => {
    expect(countWords("hello    world")).toBe(2);
  });

  it("returns 0 for empty string", () => {
    expect(countWords("")).toBe(0);
  });

  it("returns 0 for whitespace only", () => {
    expect(countWords("   ")).toBe(0);
  });
});
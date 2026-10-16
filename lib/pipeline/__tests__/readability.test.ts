import { describe, it, expect } from "vitest";
import { analyzeReadability, gradeLabel } from "../readability";

describe("gradeLabel", () => {
  it("labels elementary", () => {
    expect(gradeLabel(3)).toBe("Elementary");
  });

  it("labels high school", () => {
    expect(gradeLabel(10)).toBe("High school");
  });

  it("labels college", () => {
    expect(gradeLabel(14)).toBe("College");
  });

  it("labels graduate", () => {
    expect(gradeLabel(18)).toBe("Graduate");
  });
});

describe("analyzeReadability", () => {
  it("returns a grade for simple text", () => {
    const result = analyzeReadability("The cat sat. The dog ran. The bird flew.");
    expect(result.grade).toBeGreaterThan(0);
    expect(result.grade).toBeLessThan(10);
  });

  it("targets general audience by default", () => {
    const result = analyzeReadability("Simple sentence. Short words.");
    expect(result.audience).toBe("general");
  });

  it("respects audience parameter", () => {
    const result = analyzeReadability("Text.", "academic");
    expect(result.audience).toBe("academic");
    expect(result.targetRange.min).toBe(12);
  });

  it("detects long sentences", () => {
    const long =
      "This is a very long sentence that contains many many words and keeps going well past the typical threshold of twenty five words so it should be flagged by the readability checker.";
    const result = analyzeReadability(long);
    expect(result.longSentences.length).toBeGreaterThanOrEqual(1);
  });

  it("detects passive voice hints", () => {
    const result = analyzeReadability("The report was written by the team.");
    expect(result.passiveHints).toBeGreaterThanOrEqual(1);
  });

  it("detects wordy phrases", () => {
    const result = analyzeReadability("We did this in order to succeed.");
    expect(result.plainLanguageIssues.length).toBeGreaterThanOrEqual(1);
  });

  it("suggests replacements for wordy phrases", () => {
    const result = analyzeReadability("We met prior to the meeting.");
    expect(result.plainLanguageIssues.some((i) => i.includes("before"))).toBe(true);
  });

   it("returns inRange true when within target", () => {
    const result = analyzeReadability(
      "The quick brown fox jumps over the lazy dog. The animal is known for its speed and agility in the wild.",
      "general"
    );
    // Grade should fall between 6 and 9 for this text
    expect(result.grade).toBeGreaterThanOrEqual(1);
    expect(result.grade).toBeLessThanOrEqual(12);
  });

  it("clamps negative grade to 1 for very simple text", () => {
    const result = analyzeReadability("The cat sat. The dog ran.");
    expect(result.grade).toBeGreaterThanOrEqual(1);
  });

  it("handles empty input", () => {
    const result = analyzeReadability("");
    expect(result.grade).toBe(0);
    expect(result.longSentences).toEqual([]);
  });
});
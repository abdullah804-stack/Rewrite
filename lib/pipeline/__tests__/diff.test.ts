import { describe, it, expect } from "vitest";
import { diffSentences, assembleAccepted, assembleOriginal } from "../diff";

describe("diffSentences", () => {
  it("marks identical sentences as unchanged", () => {
    const result = diffSentences(
      "The cat sat on the mat. The dog ran.",
      "The cat sat on the mat. The dog ran."
    );
    expect(result.changedCount).toBe(0);
    expect(result.unchangedCount).toBe(2);
  });

  it("marks reworded sentences as changed", () => {
    const result = diffSentences(
      "It is important to note that we should proceed.",
      "We should proceed."
    );
    expect(result.changedCount).toBeGreaterThanOrEqual(1);
  });

  it("explains shortening", () => {
    const result = diffSentences(
      "This is a very long sentence that contains many unnecessary words and keeps going.",
      "This sentence is long."
    );
    const changed = result.segments.find((s) => s.changed);
    expect(changed?.reason).toMatch(/shorten/i);
  });

  it("explains contraction addition", () => {
    const result = diffSentences(
      "We are going to the store.",
      "We're going to the store."
    );
    const changed = result.segments.find((s) => s.changed);
    expect(changed?.reason).toMatch(/contraction/i);
  });

  it("handles empty original", () => {
    const result = diffSentences("", "Something new.");
    expect(result.segments.length).toBeGreaterThanOrEqual(1);
  });

  it("handles empty rewritten", () => {
    const result = diffSentences("Something old.", "");
    expect(result.segments.length).toBeGreaterThanOrEqual(1);
  });

  it("handles both empty", () => {
    const result = diffSentences("", "");
    expect(result.segments.length).toBe(0);
  });

  it("defaults all segments to accepted", () => {
    const result = diffSentences("One. Two.", "One. Two.");
    expect(result.segments.every((s) => s.accepted)).toBe(true);
  });
});

describe("assembleAccepted", () => {
  it("uses rewritten for changed and accepted", () => {
    const diff = diffSentences("Original text.", "Rewritten text.");
    const result = assembleAccepted(diff);
    expect(result).toBe("Rewritten text.");
  });

  it("uses original for unchanged", () => {
    const diff = diffSentences("Same. Same.", "Same. Same.");
    const result = assembleAccepted(diff);
    expect(result).toBe("Same. Same.");
  });

  it("skips rejected changed segments", () => {
    const diff = diffSentences("Original text.", "Rewritten text.");
    diff.segments[0].accepted = false;
    const result = assembleAccepted(diff);
    expect(result).toBe("Original text.");
  });
});

describe("assembleOriginal", () => {
  it("returns original sentences joined", () => {
    const diff = diffSentences("One. Two.", "Uno. Dos.");
    expect(assembleOriginal(diff)).toBe("One. Two.");
  });
});
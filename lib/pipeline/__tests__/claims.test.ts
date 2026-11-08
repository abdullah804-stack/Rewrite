import { describe, it, expect } from "vitest";
import { findSourceChecks, type SourceCheckFlag } from "../claims";

describe("findSourceChecks", () => {
  it("detects a percentage", () => {
    const result = findSourceChecks("About 42% of users agreed.");
    expect(result.flags.some((f: SourceCheckFlag) => f.kind === "percentage")).toBe(true);
    expect(result.unsourcedCount).toBe(1);
  });

  it("marks a percentage as sourced if the sentence contains a URL", () => {
    const result = findSourceChecks("About 42% of users agreed, see https://example.com.");
    const percentage = result.flags.find((f: SourceCheckFlag) => f.kind === "percentage");
    expect(percentage?.hasSource).toBe(true);
    expect(result.sourcedCount).toBe(1);
  });

  it("detects a currency figure", () => {
    const result = findSourceChecks("Revenue reached $5 million.");
    expect(result.flags.some((f: SourceCheckFlag) => f.kind === "currency")).toBe(true);
  });

  it("detects a study reference without a citation", () => {
    const result = findSourceChecks("Studies show that reading improves memory.");
    expect(result.flags.some((f: SourceCheckFlag) => f.kind === "study-reference")).toBe(true);
  });

  it("marks a study reference as sourced if a citation is nearby", () => {
    const result = findSourceChecks(
      "Studies show that reading improves memory (Smith et al., 2023)."
    );
    const study = result.flags.find((f: SourceCheckFlag) => f.kind === "study-reference");
    expect(study?.hasSource).toBe(true);
  });

  it("detects an expert reference without a name", () => {
    const result = findSourceChecks("Experts say the economy is recovering.");
    expect(result.flags.some((f: SourceCheckFlag) => f.kind === "expert-reference")).toBe(true);
  });

  it("detects a large statistic", () => {
    const result = findSourceChecks("The company hired 1,200 employees.");
    expect(result.flags.some((f: SourceCheckFlag) => f.kind === "statistic")).toBe(true);
  });

  it("detects a date reference", () => {
    const result = findSourceChecks("In 2023, the market shifted.");
    expect(result.flags.some((f: SourceCheckFlag) => f.kind === "date")).toBe(true);
  });

  it("marks a date as sourced if a URL is in the sentence", () => {
    const result = findSourceChecks(
      "In 2023, the market shifted (see https://example.com)."
    );
    const date = result.flags.find((f: SourceCheckFlag) => f.kind === "date");
    expect(date?.hasSource).toBe(true);
  });

  it("returns zero flags for clean text", () => {
    const result = findSourceChecks("The cat sat on the mat.");
    expect(result.flags.length).toBe(0);
    expect(result.unsourcedCount).toBe(0);
  });

  it("returns flags in order of appearance", () => {
    const result = findSourceChecks("In 2023, about 42% of users agreed.");
    const starts = result.flags.map((f: SourceCheckFlag) => f.start);
    for (let i = 1; i < starts.length; i++) {
      expect(starts[i]).toBeGreaterThanOrEqual(starts[i - 1]);
    }
  });
});
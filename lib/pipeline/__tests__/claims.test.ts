import { describe, it, expect } from "vitest";
import { findClaims } from "../claims";

describe("findClaims", () => {
  it("flags a percentage with no source", () => {
    const result = findClaims("We grew 42% last year.");
    expect(result.unsourcedCount).toBeGreaterThanOrEqual(1);
    expect(result.flags.some((f) => f.kind === "percentage")).toBe(true);
  });

  it("does not flag a percentage with a URL nearby", () => {
    const result = findClaims(
      "We grew 42% last year, according to https://example.com/report."
    );
    const percentage = result.flags.find((f) => f.kind === "percentage");
    expect(percentage?.hasSource).toBe(true);
  });

  it("flags a currency figure", () => {
    const result = findClaims("Revenue was $5 million.");
    expect(result.flags.some((f) => f.kind === "currency")).toBe(true);
  });

  it("flags a study reference with no citation", () => {
    const result = findClaims("Studies show that coffee improves focus.");
    expect(result.flags.some((f) => f.kind === "study-reference")).toBe(true);
  });

  it("does not flag a study reference with citation", () => {
    const result = findClaims(
      "Studies show that coffee improves focus (Smith et al., 2020)."
    );
    const study = result.flags.find((f) => f.kind === "study-reference");
    expect(study?.hasSource).toBe(true);
  });

  it("flags an expert reference with no name", () => {
    const result = findClaims("Experts say the market will recover.");
    expect(result.flags.some((f) => f.kind === "expert-reference")).toBe(true);
  });

  it("flags a large statistic", () => {
    const result = findClaims("The company serves 1,500,000 customers.");
    expect(result.flags.some((f) => f.kind === "statistic")).toBe(true);
  });

  it("flags a date reference", () => {
    const result = findClaims("In 2023, we launched the product.");
    expect(result.flags.some((f) => f.kind === "date")).toBe(true);
  });

  it("does not flag a date with source", () => {
    const result = findClaims("In 2023, we launched, per our annual report.");
    const date = result.flags.find((f) => f.kind === "date");
    expect(date?.hasSource).toBe(true);
  });

  it("returns no flags for clean text", () => {
    const result = findClaims("The cat sat on the mat. The dog ran fast.");
    expect(result.flags.length).toBe(0);
  });

  it("handles empty input", () => {
    const result = findClaims("");
    expect(result.flags.length).toBe(0);
    expect(result.unsourcedCount).toBe(0);
  });

  it("does not double-flag overlapping spans", () => {
    const result = findClaims("We grew 42% in 2023.");
    // 42% and 2023 shouldn't overlap, but if patterns collided we'd see dupes
    const starts = result.flags.map((f) => f.start);
    const unique = new Set(starts);
    expect(starts.length).toBe(unique.size);
  });

  it("counts sourced and unsourced correctly", () => {
    const result = findClaims(
      "We grew 42% (Smith et al., 2020). But 17% of users churned."
    );
    expect(result.sourcedCount).toBeGreaterThanOrEqual(1);
    expect(result.unsourcedCount).toBeGreaterThanOrEqual(1);
  });
});
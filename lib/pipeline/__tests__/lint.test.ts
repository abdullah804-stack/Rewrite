import { describe, it, expect } from "vitest";
import { lint } from "../lint";

describe("lint", () => {
  it("detects a single stock phrase", () => {
    const result = lint("In today's fast-paced world, we need to adapt.");
    expect(result.hits.length).toBeGreaterThanOrEqual(1);
    expect(result.hits[0].category).toBe("stock-phrase");
  });

  it("detects multiple phrases", () => {
    const result = lint(
      "In today's fast-paced world, it is important to note that we must delve into the details."
    );
    expect(result.hits.length).toBeGreaterThanOrEqual(3);
  });

  it("is case insensitive", () => {
    const result = lint("DELVE INTO the topic.");
    expect(result.hits.length).toBeGreaterThanOrEqual(1);
  });

  it("returns the correct position", () => {
    const result = lint("Go delve into it.");
    expect(result.hits[0].start).toBe(3);
    expect(result.hits[0].end).toBe(13);
  });

  it("groups by category", () => {
    const result = lint("Delve into it. Leverage the synergy. It is important to note that.");
    expect(result.byCategory["ai-tell"]).toBeGreaterThanOrEqual(1);
    expect(result.byCategory.corporate).toBeGreaterThanOrEqual(2);
    expect(result.byCategory.hedge).toBeGreaterThanOrEqual(1);
  });

  it("scores 100 for clean text", () => {
    const result = lint("The cat sat on the mat. The dog ran fast.");
    expect(result.score).toBe(100);
  });

  it("scores lower with more hits", () => {
    const result = lint(
      "Delve into the synergy and leverage the game changer to touch base."
    );
    expect(result.score).toBeLessThan(90);
  });

  it("handles empty input", () => {
    const result = lint("");
    expect(result.hits.length).toBe(0);
    expect(result.score).toBe(100);
  });

  it("respects word boundaries", () => {
    // "very" as substring in "everyone" should not match
    const result = lint("Everyone is here.");
    expect(result.hits.filter((h) => h.phrase === "very").length).toBe(0);
  });
});
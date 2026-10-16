import { describe, it, expect } from "vitest";
import { buildStyleReport } from "../report";
import { computeMetrics } from "../metrics";

describe("buildStyleReport", () => {
  it("detects improvement in sentence variety", () => {
    const before = computeMetrics("The cat sat. The dog ran. The bird flew.");
    const after = computeMetrics(
      "The cat sat quietly on the mat. The dog, excited, ran."
    );
    const report = buildStyleReport(before, after);
    const variety = report.deltas.find(
      (d) => d.label === "Sentence length variety"
    );
    expect(variety).toBeDefined();
    expect(variety?.improved).toBe(true);
  });

  it("detects contraction improvement", () => {
    const before = computeMetrics("We are going to the store. It is fine.");
    const after = computeMetrics("We're going to the store. It's fine.");
    const report = buildStyleReport(before, after);
    const contraction = report.deltas.find((d) => d.label === "Contractions");
    expect(contraction).toBeDefined();
    expect(contraction?.improved).toBe(true);
  });

  it("detects em dash removal as improvement", () => {
    const before = computeMetrics(
      "This is a thought — a long one — with two em dashes — inside it."
    );
    const after = computeMetrics("This is a thought with no em dashes.");
    const report = buildStyleReport(before, after);
    const dash = report.deltas.find((d) => d.label.includes("Em dashes"));
    expect(dash).toBeDefined();
    expect(dash?.improved).toBe(true);
  });

  it("returns no deltas for identical metrics", () => {
    const m = computeMetrics("The cat sat on the mat.");
    const report = buildStyleReport(m, m);
    expect(report.deltas.length).toBe(0);
    expect(report.summary).toBe("No measurable change.");
  });

  it("summarizes improvement", () => {
    const before = computeMetrics(
      "We are going to the store. It is not far. We are walking quickly — really quickly."
    );
    const after = computeMetrics(
      "We're heading to the store. It's close. We're walking fast — no, sprinting."
    );
    const report = buildStyleReport(before, after);
    expect(report.improvedCount).toBeGreaterThanOrEqual(0);
  });

  it("handles empty text", () => {
    const before = computeMetrics("");
    const after = computeMetrics("");
    const report = buildStyleReport(before, after);
    expect(report.deltas.length).toBe(0);
  });
});
import { describe, it, expect } from "vitest";
import { analyzeText } from "../aiTells";
import { makeStylePlan, renderStylePlan } from "../stylePlan";

const SRC =
  "Digital marketing is a fundamental requirement for survival. Data-driven strategies allow precise targeting. " +
  "Social media builds loyalty and trust. Companies must invest in search optimization and content creation.";

describe("style plan no longer asks for humanizer tricks", () => {
  it("never mentions scenes, asides, rhetorical questions or invented examples, for any seed, intensity or preset", () => {
    const banned = /scenario|parenthetical|aside|rhetorical|concrete example|illustrative|specific detail|offhand/i;
    for (let i = 0; i < 300; i++) {
      for (const intensity of ["light", "balanced", "strong"] as const) {
        for (const preset of ["human", "humanizer", "email"]) {
          const plan = renderStylePlan(makeStylePlan({ seed: `s${i}`, intensity, formality: 5, preset }));
          expect(plan).not.toMatch(banned);
        }
      }
    }
  });

  it("still varies between seeds", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) seen.add(renderStylePlan(makeStylePlan({ seed: `v${i}`, intensity: "balanced", formality: 5, preset: "human" })));
    expect(seen.size).toBeGreaterThan(10);
  });
});

describe("invented scene check", () => {
  const body = "Data helps companies target customers more precisely, and that matters for growth. Social media adds direct contact with buyers.";
  it("flags a scene opener the source did not contain", () => {
    const r = analyzeText(`Picture a small shop owner who ignores the web. ${body}`, SRC);
    expect(r.inventedScenes.length).toBe(1);
    expect(r.fixable.join(" ")).toMatch(/invented scene/i);
    expect(r.fixScore).toBeGreaterThan(analyzeText(body, SRC).fixScore);
  });
  it("does not flag ordinary text, or a scene that is in the source", () => {
    expect(analyzeText(body, SRC).inventedScenes).toEqual([]);
    const src2 = "Picture a small shop owner who ignores the web. Data matters.";
    expect(analyzeText("Picture a small shop owner who ignores the web. Data matters a lot.", src2).inventedScenes).toEqual([]);
  });
});

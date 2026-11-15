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

import fs from "fs";
import path from "path";
import { verbatimSentences } from "../aiTells";

describe("verbatim copy guard", () => {
  const SRC2 = "Regular exercise reduces the risk of chronic disease such as heart disease. Experts recommend taking frequent breaks to stand and stretch. Sleep improves too.";
  it("finds long sentences copied word for word, ignoring case and punctuation", () => {
    const out = "People who move more get sick less. EXPERTS recommend taking frequent breaks to stand, and stretch! Sleep gets better.";
    expect(verbatimSentences(out, SRC2)).toEqual(["EXPERTS recommend taking frequent breaks to stand, and stretch!"]);
  });
  it("ignores short sentences and a genuine rewrite", () => {
    expect(verbatimSentences("Sleep improves too. Moving often protects the heart.", SRC2)).toEqual([]);
  });
  it("is flagged as fixable and raises the fix score", () => {
    const copied = analyzeText(SRC2, SRC2.replace("Sleep improves too.", ""));
    expect(copied.verbatimCopies.length).toBeGreaterThan(0);
    expect(copied.fixable.join(" ")).toMatch(/word for word/);
  });
  it("route rejects candidates that paste the draft back", () => {
    const route = fs.readFileSync(path.resolve(__dirname, "../../../app/api/rewrite/route.ts"), "utf8");
    expect(route).toMatch(/verbatimShare >= 0\.2 \|\| report\.verbatimCopies\.length >= 2\) return null/);
  });
});

describe("time budget", () => {
  const root = path.resolve(__dirname, "../../..");
  const route = fs.readFileSync(path.join(root, "app/api/rewrite/route.ts"), "utf8");
  const chat = fs.readFileSync(path.join(root, "lib/ai/chat.ts"), "utf8");
  const num = (src: string, re: RegExp) => Number(src.match(re)![1].replace(/_/g, ""));
  const maxDuration = num(route, /maxDuration = (\d+)/) * 1000;
  const callTimeout = num(chat, /DEFAULT_TIMEOUT_MS = ([\d_]+)/);
  it("no model call can start so late that it runs past the route limit", () => {
    const gen = num(route, /GENERATION_DEADLINE_MS = ([\d_]+)/);
    const repair = num(route, /REPAIR_TIME_BUDGET_MS = ([\d_]+)/);
    const extra = num(route, /REPAIR_TIME_BUDGET_MS \+ ([\d_]+) \?/);
    expect(gen + callTimeout).toBeLessThan(maxDuration - 3000);
    expect(repair + callTimeout).toBeLessThan(maxDuration - 3000);
    expect(repair + extra + callTimeout).toBeLessThan(maxDuration - 3000);
  });
});

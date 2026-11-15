import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { analyzeText, sentenceShape, DEFAULT_MAX_SHORT_RATIO, DEFAULT_MAX_LONG_SHORT_PAIRS } from "../aiTells";
import { makeStylePlan, renderStylePlan } from "../stylePlan";

const root = path.resolve(__dirname, "../../..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

// 19 words, then 2 words, repeated: the exact pattern the old prompt asked for.
const LONG = "The committee spent most of the afternoon arguing about whether the older budget rules still applied to the newer projects";
const tic = Array.from({ length: 4 }, () => `${LONG}. It did not.`).join(" ");
// Mixed medium lengths, no very short sentences.
const natural =
  "The committee argued for most of the afternoon about the older budget rules. Nobody could say for certain whether they still applied to the newer projects. " +
  "In the end the chair asked for a written opinion from the finance office, which arrived two days later and settled very little. " +
  "Several members felt the whole discussion had been a waste of time. A few others thought it had at least shown where the real disagreements were. " +
  "The next meeting was scheduled for the following month, with a shorter agenda.";

describe("sentenceShape", () => {
  it("counts very short sentences and long-then-short pairs", () => {
    expect(sentenceShape([20, 3, 20, 3, 10])).toEqual({ shortRatio: 0.4, longShortPairs: 2 });
    expect(sentenceShape([10, 12, 14])).toEqual({ shortRatio: 0, longShortPairs: 0 });
    expect(sentenceShape([])).toEqual({ shortRatio: 0, longShortPairs: 0 });
  });
  it("only counts a pair when the first sentence is long (18+) and the second 5 or fewer", () => {
    expect(sentenceShape([17, 3]).longShortPairs).toBe(0);
    expect(sentenceShape([18, 5]).longShortPairs).toBe(1);
    expect(sentenceShape([18, 6]).longShortPairs).toBe(0);
  });
});

describe("analyzeText rhythm checks", () => {
  it("flags the long-then-short pattern with a plain-language problem", () => {
    const r = analyzeText(tic, "");
    expect(r.longShortPairs).toBe(4);
    expect(r.shortRatio).toBeCloseTo(0.5);
    const msg = r.problems.join(" ");
    expect(msg).toMatch(/very short one 4 times/);
    expect(msg).toMatch(/50% of the sentences are 5 words or fewer/);
  });

  it("does not flag natural medium-length writing", () => {
    const r = analyzeText(natural, "");
    expect(r.longShortPairs).toBeLessThanOrEqual(DEFAULT_MAX_LONG_SHORT_PAIRS);
    expect(r.shortRatio).toBeLessThanOrEqual(DEFAULT_MAX_SHORT_RATIO);
    expect(r.problems.join(" ")).not.toMatch(/very short|5 words or fewer/);
  });

  it("scores the pattern worse than natural text", () => {
    expect(analyzeText(tic, "").score).toBeGreaterThan(analyzeText(natural, "").score);
  });

  it("limits are configurable", () => {
    const r = analyzeText(tic, "", { maxShortRatio: 0.9, maxLongShortPairs: 9 });
    expect(r.problems.join(" ")).not.toMatch(/very short one|5 words or fewer/);
  });

  it("flags a question opener only when the original did not open with one", () => {
    const q = "Wondering how remote work changed things? It changed a lot of habits across the whole company over two years.";
    expect(analyzeText(q, "Remote work changed habits.").opensWithQuestion).toBe(true);
    expect(analyzeText(q, "Remote work changed habits.").problems.join(" ")).toMatch(/opens with a question/);
    expect(analyzeText(q, "Did remote work change things? Yes it did.").opensWithQuestion).toBe(false);
    expect(analyzeText(natural, "Remote work changed habits.").opensWithQuestion).toBe(false);
  });

  it("the uniform-length message no longer tells the model to use 2-6 or 25+ word sentences", () => {
    const flat = Array.from({ length: 8 }, () => "The team reviewed the plan again this week").join(". ") + ".";
    const msg = analyzeText(flat, "").problems.join(" ");
    expect(msg).toMatch(/too uniform/);
    expect(msg).not.toMatch(/2-6|25\+/);
  });
});

describe("prompts no longer push a fixed short/long rhythm", () => {
  it("none of the prompt sources mention 2-6 word or 25+ word sentences", () => {
    for (const rel of ["app/api/rewrite/route.ts", "lib/pipeline/stylePlan.ts", "lib/pipeline/aiTells.ts"]) {
      const src = read(rel);
      expect(src, rel).not.toMatch(/2-6 words/);
      expect(src, rel).not.toMatch(/25\+ words/);
      expect(src, rel).not.toMatch(/some 2-6/);
    }
  });

  it("the style plan never asks for a question opener or a long-then-short move, for any seed", () => {
    for (let i = 0; i < 300; i++) {
      for (const intensity of ["light", "balanced", "strong"] as const) {
        const text = renderStylePlan(makeStylePlan({ seed: `s${i}`, intensity, formality: 5, preset: "human" }));
        expect(text).not.toMatch(/Open with a short question/);
        expect(text).not.toMatch(/very short one/);
        expect(text).not.toMatch(/2-6|25\+/);
      }
    }
  });
});

describe("limits are calibrated against real human text", () => {
  it("most human fixtures pass the shape limits (a loose backstop, not a fight with real writing)", () => {
    const dir = path.join(root, "fixtures/clean");
    const files = fs.readdirSync(dir).filter((f) => /^\d+-gutenberg\.txt$/.test(f));
    expect(files.length).toBeGreaterThanOrEqual(5);
    let flagged = 0;
    for (const f of files) {
      const r = analyzeText(fs.readFileSync(path.join(dir, f), "utf8"), "");
      if (r.shortRatio > DEFAULT_MAX_SHORT_RATIO || r.longShortPairs > DEFAULT_MAX_LONG_SHORT_PAIRS) flagged++;
    }
    expect(flagged / files.length).toBeLessThanOrEqual(0.34);
  });
});

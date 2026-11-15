import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { analyzeText, verbatimSentences } from "../aiTells";
import { normalizeTypography } from "../typography";

describe("normalizeTypography", () => {
  it("replaces non-breaking hyphens, curly quotes, nbsp, zero-width characters and em dashes", () => {
    expect(normalizeTypography("mood‑boosters and night‑time")).toBe("mood-boosters and night-time");
    expect(normalizeTypography("it’s “fine”")).toBe("it's \"fine\"");
    expect(normalizeTypography("a b​c")).toBe("a bc");
    expect(normalizeTypography("afterthoughts either—fueling right")).toBe("afterthoughts either, fueling right");
    expect(normalizeTypography("one — two")).toBe("one, two");
  });
  it("leaves ordinary text and en dashes in ranges alone", () => {
    const t = "Plain text, with commas. Pages 3–5 stay.";
    expect(normalizeTypography(t)).toBe(t);
  });
  it("is idempotent", () => {
    const once = normalizeTypography("a—b ‘c’");
    expect(normalizeTypography(once)).toBe(once);
  });
});

const SRC = Array.from({ length: 12 }, (_, i) => `Exercise matters for health in way number ${i + 1} according to many different experts today`).join(". ") + ".";

describe("transition-start and length checks", () => {
  it("flags a run of connecting-word openers", () => {
    const out = ["Also the habit helps with sleep and energy during the whole day", "Thus the office routine hurts posture over many years of sitting", "Meanwhile small goals keep people motivated for much longer", "Overall the plan works best when it is flexible and simple", "People differ so the routine should fit the person"].join(". ") + ".";
    const r = analyzeText(out, SRC);
    expect(r.transitionStarts.length).toBe(4);
    expect(r.fixable.join(" ")).toMatch(/open with a connecting word/);
  });
  it("does not flag one or two", () => {
    const out = "Also the habit helps with sleep and energy during the day. People differ, so the routine should fit the person well. Small goals keep people motivated for much longer than big ones. Thus posture suffers after years of sitting at a desk all day long.";
    expect(analyzeText(out, SRC).fixable.join(" ")).not.toMatch(/connecting word/);
  });
  it("flags a rewrite that is much longer than the draft, not a shorter one", () => {
    const longer = SRC + " " + SRC.slice(0, Math.floor(SRC.length * 0.3));
    expect(analyzeText(longer, SRC).lengthRatio).toBeGreaterThan(1.15);
    expect(analyzeText(longer, SRC).fixable.join(" ")).toMatch(/longer than the draft/);
    const shorter = SRC.slice(0, Math.floor(SRC.length * 0.7));
    expect(analyzeText(shorter, SRC).lengthRatio).toBeLessThan(1);
    expect(analyzeText(shorter, SRC).fixable.join(" ")).not.toMatch(/longer than the draft/);
  });
  it("short originals are not length-checked", () => {
    expect(analyzeText("a b c d e f g h i j k l m n o p", "short original text here").lengthRatio).toBe(1);
  });
});

describe("verbatim copy ignores protected quotes", () => {
  const quote = "The committee concluded that the evidence was sufficient to proceed with the plan";
  const src = `Intro sentence about the project and its early history. "${quote}." Another point about costs and timing for the work.`;
  it("a restored quote is not counted as copying; a pasted sentence is", () => {
    const out = `People started the project early. "${quote}." Costs and timing shaped the work.`;
    expect(verbatimSentences(out, src).length).toBeGreaterThan(0);
    expect(verbatimSentences(out, src, [`"${quote}."`])).toEqual([]);
    const pasted = `Intro sentence about the project and its early history. Costs and timing shaped the work.`;
    expect(verbatimSentences(pasted, src, [`"${quote}."`]).length).toBe(1);
  });
});

describe("route wiring for the detector-pattern changes", () => {
  const route = fs.readFileSync(path.resolve(__dirname, "../../../app/api/rewrite/route.ts"), "utf8");
  it("normalises typography on the masked text and keeps paragraphs in sync", () => {
    expect(route).toMatch(/restore\(normalizeTypography\(best\.tokenized\), spans\)/);
    expect(route).toMatch(/paragraphs: finalParagraphs/);
  });
  it("passes protected quote/citation/code/heading text to the copy check", () => {
    expect(route).toMatch(/ignoreVerbatim/);
  });
  it("asks for plain literal wording and no extra length", () => {
    expect(route).toMatch(/plain, literal prose/);
    expect(route).toMatch(/Do not make the text longer than the draft/);
  });
});

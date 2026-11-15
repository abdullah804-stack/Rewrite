import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { analyzeText, type TellReport } from "../aiTells";
import { needsRepair, rankScore, repairCost, repairModeFromEnv, repairProblems, TARGET_SCORE } from "../repairPlan";

const root = path.resolve(__dirname, "../../..");

// Eight near-identical sentences: only sentence-shape statistics are wrong.
const FLAT = Array.from({ length: 8 }, (_, i) => `The team reviewed plan number ${["one", "two", "three", "four", "five", "six", "seven", "eight"][i]} this week`).join(". ") + ".";
// Varied lengths, but stuffed with stock phrases and em dashes: concrete defects.
const STOCKY =
  "It is important to note that this plan will leverage robust synergies. The team met on Monday — twice — and then again on Tuesday, which was long. " +
  "Nobody was sure what the quarterly numbers meant for the next release, so the discussion wandered for most of the afternoon. " +
  "Delve into the details, they said — and so they did. Later, a short note went round. Ultimately, it is a testament to the team that the plan survived at all.";
const NATURAL =
  "The committee argued for most of the afternoon about the older budget rules. Nobody could say for certain whether they still applied to the newer projects. " +
  "In the end the chair asked for a written opinion from the finance office, which arrived two days later and settled very little. " +
  "Several members felt the whole discussion had been a waste of time. A few others thought it had at least shown where the real disagreements were. " +
  "The next meeting was scheduled for the following month, with a shorter agenda.";

describe("analyzeText splits problems into fixable and advisory", () => {
  it("sentence-shape statistics alone are advisory, never fixable", () => {
    const r = analyzeText(FLAT, "");
    expect(r.advisory.length).toBeGreaterThan(0);
    expect(r.fixable).toEqual([]);
    expect(r.advisory.join(" ")).toMatch(/too uniform/);
    expect(r.advisoryScore).toBeGreaterThan(0);
    expect(r.fixScore).toBe(0);
  });

  it("concrete defects are fixable", () => {
    const r = analyzeText(STOCKY, "");
    const msg = r.fixable.join(" ");
    expect(msg).toMatch(/stock AI words/);
    expect(msg).toMatch(/em dashes/);
    expect(r.fixScore).toBeGreaterThan(0);
  });

  it("problems is exactly the union, nothing lost, and score is the sum of its parts", () => {
    for (const t of [FLAT, STOCKY, NATURAL]) {
      const r = analyzeText(t, "");
      expect([...r.fixable, ...r.advisory].sort()).toEqual([...r.problems].sort());
      expect(r.score).toBeCloseTo(r.fixScore + r.advisoryScore, 10);
    }
  });

  it("classifies every kind of message: statistics advisory, wording and copying fixable", () => {
    const src = fs.readFileSync(path.join(root, "lib/pipeline/aiTells.ts"), "utf8");
    const kinds = [...src.matchAll(/flag\("(fix|advisory)",\s*\n?\s*`([^`]{0,70})/g)].map((m) => [m[1], m[2]] as const);
    expect(kinds.length).toBe(21);
    const advisoryStarts = ["Sentence lengths are too uniform", "${Math.round(shortRatio", "A long sentence is followed", "These consecutive sentences", "Too many sentences start", "The same short phrases", "Overused keywords"];
    for (const [kind, msg] of kinds) {
      const isStat = advisoryStarts.some((a) => msg.startsWith(a));
      expect(kind, msg).toBe(isStat ? "advisory" : "fix");
    }
  });
});

describe("repair plan: default mode ('fixable')", () => {
  it("does not repair a text whose only problems are sentence-shape statistics", () => {
    const r = analyzeText(FLAT, "");
    expect(r.problems.length).toBeGreaterThan(0);
    expect(needsRepair(r, [], "fixable")).toBe(false);
    expect(repairProblems(r, [], "fixable")).toEqual([]);
  });

  it("repairs concrete defects, and the repair prompt never contains rhythm statistics", () => {
    const r = analyzeText(STOCKY, "");
    expect(needsRepair(r, [], "fixable")).toBe(true);
    const asked = repairProblems(r, [], "fixable").join(" ");
    expect(asked).toMatch(/stock AI words/);
    expect(asked).not.toMatch(/too uniform|5 words or fewer|very short one/);
  });

  it("always repairs meaning problems, even when the tells are clean", () => {
    const r = analyzeText(NATURAL, "");
    expect(needsRepair(r, [], "fixable")).toBe(false);
    expect(needsRepair(r, ["a claim was dropped"], "fixable")).toBe(true);
    expect(repairProblems(r, ["a claim was dropped"], "fixable")).toEqual(["Meaning/clarity: a claim was dropped"]);
  });

  it("ranks and costs candidates on fixScore, so rhythm statistics cannot decide a winner", () => {
    const flat = analyzeText(FLAT, "");
    const stocky = analyzeText(STOCKY, "");
    expect(rankScore(flat, "fixable")).toBe(0);
    expect(rankScore(flat, "fixable")).toBeLessThan(rankScore(stocky, "fixable"));
    expect(repairCost(flat, ["x", "y"], "fixable")).toBe(4);
  });
});

describe("repair plan: mode 'all' restores the previous behaviour exactly", () => {
  it("ranks on the total score and sends every problem to the repair pass", () => {
    const r = analyzeText(FLAT, "");
    expect(rankScore(r, "all")).toBe(r.score);
    expect(repairProblems(r, [], "all")).toEqual(r.problems);
    expect(repairCost(r, ["x"], "all")).toBe(r.score + 2);
  });

  it("stops at the old target: total score <= 2 and no issues", () => {
    const low = { score: TARGET_SCORE, problems: ["p"], fixable: [], advisory: ["p"], fixScore: 0, advisoryScore: 2 } as unknown as TellReport;
    expect(needsRepair(low, [], "all")).toBe(false);
    expect(needsRepair(low, ["issue"], "all")).toBe(true);
    const high = { ...low, score: TARGET_SCORE + 0.1 } as TellReport;
    expect(needsRepair(high, [], "all")).toBe(true);
    const none = { ...high, problems: [] } as TellReport;
    expect(needsRepair(none, [], "all")).toBe(false);
  });
});

describe("repairModeFromEnv", () => {
  it("defaults to fixable; only 'all' restores the old behaviour", () => {
    expect(repairModeFromEnv(undefined)).toBe("fixable");
    expect(repairModeFromEnv("")).toBe("fixable");
    expect(repairModeFromEnv("nonsense")).toBe("fixable");
    expect(repairModeFromEnv("ALL")).toBe("all");
    expect(repairModeFromEnv(" all ")).toBe("all");
  });
});

describe("route wiring", () => {
  const route = fs.readFileSync(path.join(root, "app/api/rewrite/route.ts"), "utf8");
  it("ranks, repairs and accepts through the repair plan instead of the raw score", () => {
    expect(route).toMatch(/rankScore\(c\.report, repairMode\)/);
    expect(route).toMatch(/needsRepair\(best\.report, issues, repairMode\)/);
    expect(route).toMatch(/repairProblems\(best\.report, issues, repairMode\)/);
    expect(route).toMatch(/repairCost\(c\.report, iss, repairMode\)/);
    expect(route).not.toMatch(/report\.score <= TARGET_SCORE/);
    expect(route).not.toMatch(/\.report\.score </);
  });
  it("only the benchmark can override the mode, and the cache key follows it", () => {
    expect(route).toMatch(/benchBypass && body\.repairMode \? body\.repairMode : repairModeFromEnv\(\)/);
    expect(route).toMatch(/repairMode === "all" \? ":repair-all" : ""/);
  });
  it("reports the split score and what was not repaired", () => {
    expect(route).toMatch(/fixScore: Number\(best\.report\.fixScore/);
    expect(route).toMatch(/advisory: best\.report\.advisory/);
    expect(route).toMatch(/repairMode, repairPasses/);
  });
});

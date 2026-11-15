import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { HUMAN_EXEMPLARS, type HumanExemplar } from "../../../config/human-exemplars";
import { defaultExemplarsEnabled, pickExemplars, renderExemplarBlock, exemplarsTag, EXEMPLARS_PER_PROMPT } from "../defaultVoice";
import { extractPassages, rejectReason, MAX_PASSAGE_CHARS } from "../extractPassages";
import { analyzeText, referenceCopies } from "../../pipeline/aiTells";

const root = path.resolve(__dirname, "../../..");
const pool: HumanExemplar[] = [
  { id: "n1", register: "neutral", source: "t", text: "Neutral one." },
  { id: "n2", register: "neutral", source: "t", text: "Neutral two." },
  { id: "f1", register: "formal", source: "t", text: "Formal one." },
  { id: "f2", register: "formal", source: "t", text: "Formal two." },
  { id: "c1", register: "casual", source: "t", text: "Casual one." },
];

describe("defaultExemplarsEnabled", () => {
  it("is off unless explicitly set to on", () => {
    expect(defaultExemplarsEnabled(undefined)).toBe(false);
    expect(defaultExemplarsEnabled("")).toBe(false);
    expect(defaultExemplarsEnabled("off")).toBe(false);
    expect(defaultExemplarsEnabled("true")).toBe(false);
    expect(defaultExemplarsEnabled("ON")).toBe(true);
    expect(defaultExemplarsEnabled(" on ")).toBe(true);
  });
});

describe("pickExemplars", () => {
  it("is deterministic for a seed and varies across seeds", () => {
    const a = pickExemplars("s1", "neutral", 2, pool).map((e) => e.id);
    expect(pickExemplars("s1", "neutral", 2, pool).map((e) => e.id)).toEqual(a);
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) seen.add(pickExemplars(`s${i}`, "neutral", 2, pool).map((e) => e.id).join("+"));
    expect(seen.size).toBeGreaterThan(1);
  });

  it("prefers the requested register, then neutral, then the rest", () => {
    for (let i = 0; i < 30; i++) {
      expect(pickExemplars(`x${i}`, "formal", 2, pool).every((e) => e.register === "formal")).toBe(true);
      const casual = pickExemplars(`y${i}`, "casual", 2, pool);
      expect(casual[0].id).toBe("c1");
      expect(casual[1].register).toBe("neutral");
    }
  });

  it("never returns duplicates or more than the pool holds", () => {
    const got = pickExemplars("z", "neutral", 99, pool);
    expect(new Set(got.map((e) => e.id)).size).toBe(got.length);
    expect(got.length).toBe(pool.length);
    expect(pickExemplars("z", "neutral", 2, [])).toEqual([]);
  });

  it("works with the real shipped pool", () => {
    const got = pickExemplars("abc", "casual");
    expect(got).toHaveLength(EXEMPLARS_PER_PROMPT);
  });
});

describe("renderExemplarBlock", () => {
  it("is empty with no passages", () => expect(renderExemplarBlock([])).toBe(""));
  it("tells the model to copy rhythm only, never wording", () => {
    const block = renderExemplarBlock(pool.slice(0, 2));
    expect(block).toMatch(/Do NOT copy their words/);
    expect(block).toMatch(/plain modern English/);
    expect(block).toContain("Neutral one.");
    expect(block).toContain("Passage 2:");
  });
});

describe("exemplarsTag", () => {
  it("changes when a passage changes", () => {
    const a = exemplarsTag(pool);
    expect(exemplarsTag(pool)).toBe(a);
    expect(exemplarsTag([{ ...pool[0], text: "Changed." }, ...pool.slice(1)])).not.toBe(a);
  });
});

describe("the shipped pool", () => {
  it("is real, clean, schema-sized text", () => {
    expect(HUMAN_EXEMPLARS.length).toBeGreaterThanOrEqual(3);
    const ids = new Set<string>();
    for (const e of HUMAN_EXEMPLARS) {
      expect(ids.has(e.id)).toBe(false); ids.add(e.id);
      expect(e.text.length).toBeLessThanOrEqual(500); // the VoiceProfile exemplar limit
      expect(rejectReason(e.text), e.id).toBeNull();
      expect(e.source.length).toBeGreaterThan(5);
    }
  });

  it("every passage appears word for word in a source file (nothing hand-written)", () => {
    const sources = [
      ...fs.readdirSync(path.join(root, "fixtures/target-voice")).map((f) => path.join(root, "fixtures/target-voice", f)),
      ...fs.readdirSync(path.join(root, "fixtures/genres")).map((f) => path.join(root, "fixtures/genres", f)),
    ].map((f) => fs.readFileSync(f, "utf8").replace(/\s+/g, " "));
    for (const e of HUMAN_EXEMPLARS) expect(sources.some((s) => s.includes(e.text)), e.id).toBe(true);
  });
});

describe("extractPassages", () => {
  const good = "The village was small. Nobody there had ever seen a train, and most of the older people did not expect to. " +
    "That changed in the spring, when a surveyor arrived with a long chain and a short temper. He measured the fields twice. " +
    "The farmers watched him from the fence, arguing about what it would cost them and whether it would ever be paid.";

  it("extracts whole-sentence passages of 45-95 words", () => {
    const out = extractPassages(good + " " + good, 2);
    expect(out.length).toBeGreaterThanOrEqual(1);
    for (const p of out) {
      const w = p.split(/\s+/).length;
      expect(w).toBeGreaterThanOrEqual(45);
      expect(w).toBeLessThanOrEqual(95);
      expect(p.length).toBeLessThanOrEqual(MAX_PASSAGE_CHARS);
      expect(p).toMatch(/[.!?]$/);
    }
  });

  it("rejects dialogue, scan errors, truncation and marathon sentences", () => {
    expect(rejectReason('He said "no" and left. ' + good)).toMatch(/dialogue/);
    expect(rejectReason("The com- mercial contest was fierce. " + good)).toMatch(/hyphenation/);
    expect(rejectReason("The thing^ was fine. " + good)).toMatch(/scan-error/);
    expect(rejectReason(good.replace(/\.$/, " to Mr."))).toMatch(/abbreviation/);
    expect(rejectReason("It went on " + "and on ".repeat(35) + "forever.")).toMatch(/marathon/);
    expect(rejectReason("starts lowercase. " + good)).toMatch(/sentence start/);
    expect(rejectReason(good)).toBeNull();
  });

  it("returns nothing for text with no usable passage", () => {
    expect(extractPassages('"Hi," he said. "No," she said.', 3)).toEqual([]);
  });
});

describe("reference copy guard", () => {
  const ref = "Salt River would be made navigable and Florida would become a metropolis in time.";
  it("finds 5-word runs copied from a reference, ignoring case and punctuation", () => {
    expect(referenceCopies("They said Florida would become a METROPOLIS, again.", [ref])).toEqual(["florida would become a metropolis"]);
  });
  it("ignores shorter overlaps", () => {
    expect(referenceCopies("Florida would become something else entirely.", [ref])).toEqual([]);
  });
  it("is reported by analyzeText as a problem and a score penalty, only when references are given", () => {
    const text = "Everyone agreed Florida would become a metropolis within a decade or so, and the town council planned accordingly for many years.";
    const withRef = analyzeText(text, "", { references: [ref] });
    const without = analyzeText(text, "");
    expect(withRef.referenceCopies.length).toBe(1);
    expect(withRef.problems.join(" ")).toMatch(/copied from the reference passages/);
    expect(withRef.score).toBeGreaterThan(without.score);
    expect(without.referenceCopies).toEqual([]);
  });
});

describe("route wiring", () => {
  const route = fs.readFileSync(path.join(root, "app/api/rewrite/route.ts"), "utf8");
  it("only applies the default voice when no profile was chosen", () => {
    expect(route).toMatch(/const useExemplars = !profileRecord &&/);
  });
  it("only lets the benchmark override the setting (needs the bench key)", () => {
    expect(route).toMatch(/benchBypass && typeof body\.defaultExemplars === "boolean"/);
  });
  it("the cache key changes with the passages and with the flag", () => {
    expect(route).toMatch(/useExemplars \? `\$\{PROMPT_VERSION\}:\$\{exemplarsTag\(\)\}` : PROMPT_VERSION/);
  });
  it("the repair pass keeps checking copies against the same references", () => {
    expect(route).toMatch(/ctx, best\.references\)/);
  });
});

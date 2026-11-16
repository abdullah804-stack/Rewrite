import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { analyzeText, PLAIN_MAX_COMMAS } from "../aiTells";
import { PLAIN_SYSTEM, dropIntroCommas, commasPerSentence } from "../plainMode";
import { PRESETS } from "../../../config/presets";

const root = path.resolve(__dirname, "../../..");

describe("dropIntroCommas", () => {
  it("removes the comma after a sentence-opening word or phrase only", () => {
    expect(dropIntroCommas("However, it works. Overall, this helps. Generally speaking, people agree."))
      .toBe("However it works. Overall this helps. Generally speaking people agree.");
    expect(dropIntroCommas("It works, however, only sometimes. In 2020, it grew.")).toBe("It works, however, only sometimes. In 2020, it grew.");
  });
  it("handles the start of the text and quotes after punctuation", () => {
    expect(dropIntroCommas("Usually, a plan helps. \"Done.\" Also, we won.")).toBe("Usually a plan helps. \"Done.\" Also we won.");
  });
  it("is idempotent and leaves text without such openers alone", () => {
    const once = dropIntroCommas("However, a, b, c.");
    expect(dropIntroCommas(once)).toBe(once);
    expect(dropIntroCommas("A plain sentence, with one comma.")).toBe("A plain sentence, with one comma.");
  });
  it("commasPerSentence counts commas over sentences", () => {
    expect(commasPerSentence("a, b. c, d, e.", 2)).toBe(1.5);
    expect(commasPerSentence("", 0)).toBe(0);
  });
});

// Real texts from the measured pair (a 0% and a 100% StealthWriter result).
const SRC = "Maintaining a consistent fitness routine is essential for long-term physical and mental well-being. Regular exercise helps in managing weight. Engaging in physical activity triggers the release of endorphins. Proper nutrition and adequate hydration play a crucial role in recovery. Participating in group classes provides an opportunity to connect with others. Experts recommend taking frequent breaks to stand and stretch. It is never too late to start.";
const COMMA_HEAVY = "Usually, keeping a consistent workout schedule pays off for both body and mind. It helps keep your weight in check, while also sending endorphins through your system, which lifts your mood. Fueling yourself with solid food, and staying hydrated, lets you perform better, and bounce back faster. And joining a class, or a team sport, gives you people to talk to, which eases the mind. Experts say taking brief pauses to stand, stretch, or walk, breaks up the hours you spend at a desk. You can start at any age, because age is not a barrier, as many people find.";
const PLAIN = "Sticking to a regular routine will help your body and mind. You will be able to manage your weight and produce endorphins which will improve your mood. Eating well and staying hydrated will help you recover quicker. Going to a class gives you social contact which will help your mind. Taking short breaks to stand up and stretch will help according to experts. Anyone can start a routine at any age.";

describe("plain-mode tell checks", () => {
  it("flags comma-heavy, long sentences only in plain mode", () => {
    const plain = analyzeText(COMMA_HEAVY, SRC, { plain: true });
    expect(plain.commasPerSentence).toBeGreaterThan(PLAIN_MAX_COMMAS);
    expect(plain.fixable.join(" ")).toMatch(/Too many commas/);
    expect(analyzeText(COMMA_HEAVY, SRC).fixable.join(" ")).not.toMatch(/Too many commas/);
  });
  it("a plain, comma-light text passes the comma check and scores lower", () => {
    const good = analyzeText(PLAIN, SRC, { plain: true });
    expect(good.commasPerSentence).toBeLessThanOrEqual(PLAIN_MAX_COMMAS);
    expect(good.fixable.join(" ")).not.toMatch(/Too many commas|average .* words/);
    expect(good.fixScore).toBeLessThan(analyzeText(COMMA_HEAVY, SRC, { plain: true }).fixScore);
  });
  it("a close sentence-by-sentence paraphrase is not a defect in plain mode (no mirror/copied-pair flags)", () => {
    const standard = analyzeText(PLAIN, SRC);
    const plain = analyzeText(PLAIN, SRC, { plain: true });
    expect(plain.mirrorsOriginal).toBe(false);
    expect(plain.fixable.join(" ")).not.toMatch(/follow the original one-to-one|word pairs are copied/);
    expect(plain.fixScore).toBeLessThanOrEqual(standard.fixScore);
  });
  it("copying whole sentences is still a defect in plain mode", () => {
    const pasted = PLAIN + " Participating in group classes provides an opportunity to connect with others.";
    expect(analyzeText(pasted, SRC, { plain: true }).verbatimCopies.length).toBeGreaterThan(0);
  });
});

describe("plain-mode prompt and wiring", () => {
  const route = fs.readFileSync(path.join(root, "app/api/rewrite/route.ts"), "utf8");
  it("the prompt asks for the measured features and keeps the safety rules", () => {
    expect(PLAIN_SYSTEM).toMatch(/very few commas/i);
    expect(PLAIN_SYSTEM).toMatch(/speak to the reader as "you"/);
    expect(PLAIN_SYSTEM).toMatch(/10 to 16 words/);
    expect(PLAIN_SYSTEM).toMatch(/Keep the order/);
    expect(PLAIN_SYSTEM).toMatch(/Add nothing/);
    expect(PLAIN_SYSTEM).toMatch(/\[FACT_1\]/);
    expect(PLAIN_SYSTEM).toMatch(/"paragraphs"/);
  });
  it("the Stealth preset no longer asks for asides or a 'quick note' voice", () => {
    expect(PRESETS.stealth.instruction).not.toMatch(/small asides|quick note|a little informal/i);
    expect(PRESETS.stealth.instruction).toMatch(/very few commas/i);
  });
  it("plain mode is on for the Stealth preset, overridable only with the bench key", () => {
    expect(route).toMatch(/benchBypass && typeof body\.plainMode === "boolean" \? body\.plainMode : presetId === "stealth"/);
  });
  it("plain mode skips the points list, the style plan and exemplars, and uses the plain prompt", () => {
    expect(route).toMatch(/intensity === "light" \|\| plainMode \? null : await extractClaims/);
    expect(route).toMatch(/plainMode \? "" : renderStylePlan\(plan\)/);
    expect(route).toMatch(/system: plainMode \? PLAIN_SYSTEM : BASE_SYSTEM/);
    expect(route).toMatch(/const useExemplars = !plainMode/);
  });
  it("the cache key separates plain mode, and the final text drops intro commas deterministically", () => {
    expect(route).toMatch(/plainMode \? ":plain" : ""/);
    expect(route).toMatch(/normalizeTypography\(plainMode \? dropIntroCommas\(t\) : t\)/);
    expect(fs.readFileSync(path.join(root, "lib/pipeline/plainMode.ts"), "utf8")).not.toMatch(/Math\.random|Date\.now/);
  });
  it("plain mode runs at a lower temperature", () => {
    expect(route).toMatch(/plainMode \? \{ temperature: 0\.7 \} : \{\}/);
  });
});

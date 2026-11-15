/**
 * stylePlan.ts
 * Builds a different (but reproducible) set of writing "moves" for every run.
 * Why: when the prompt contains fixed example phrases, the model copies them
 * into every output, and detectors flag the repeated patterns. A seeded plan
 * gives variety across runs while the same input + settings still hits the cache.
 */
import { createHash } from "crypto";

export type Register = "casual" | "neutral" | "formal";
export type Intensity = "light" | "balanced" | "strong";

export type StylePlan = {
  register: Register;
  opening: string;
  structure: string[];
  voice: string[];
  rhythm: string;
  ending: string;
};

export function rng(seed: string) {
  let a = createHash("sha256").update(seed).digest().readUInt32LE(0);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickN<T>(r: () => number, arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

// Experiment (humanizer-experiment): the old menus asked for scenario openers, parenthetical asides,
// rhetorical questions, invented examples and "ending on a specific detail". Those are the standard
// humanizer tricks and they add content the draft never had, so they are gone. What is left only
// changes how the draft's own points are ordered and worded.
const OPENINGS = [
  "Open with the draft's main point, stated plainly in your own words.",
  "Open with the consequence, then work back to the cause.",
  "Open with a qualified claim (using words like 'mostly', 'usually', 'in practice').",
  "Open with the point the draft treats as secondary, then bring in the main one.",
];

const STRUCTURE = [
  "Merge two related points into one longer sentence with a subordinate clause.",
  "Reorder the ideas so the least obvious point comes first.",
  "Drop pure filler sentences, but never a fact, number, or argument.",
  "Split one dense idea across two sentences, and fuse two thin ones into one.",
  "Use a pronoun or short reference instead of repeating the full topic phrase.",
  "Fold one point into the sentence before it instead of giving it its own sentence.",
];

const ENDINGS = [
  "Do not write a concluding moral at all; stop when the last point is made.",
  "End on the last point of the draft, stated plainly, with no summary and no new line added after it.",
  "End on a complete statement. Never end on a question, a dangling fragment, or an added one-line kicker.",
];

const VOICE: Record<Register, string[]> = {
  casual: [
    "Use contractions freely.",
    "Start one or two sentences with And, But or So.",
    "Pick informal wording fresh for this text; no stock filler openers and no inserted reactions.",
    "Use at most one fragment, and only where it adds emphasis.",
  ],
  neutral: [
    "Use contractions where they sound natural.",
    "Prefer plain, everyday words over abstract nouns.",
    "Include one or two natural hedges (probably, tends to, in most cases).",
    "Allow one sentence that starts with a conjunction.",
  ],
  formal: [
    "Keep a professional register: no slang, no filler interjections.",
    "Create rhythm through clause structure and precise verbs, not through slang.",
    "Mostly avoid contractions.",
    "Use one short sentence for emphasis.",
    "Prefer concrete nouns and verbs over abstract ones.",
  ],
};

export function pickRegister(preset: string, formality: number): Register {
  if (preset === "humanizer" || preset === "stealth") return "casual";
  if (formality <= 3) return "casual";
  if (formality >= 8 || preset === "email" || preset === "linkedin") return "formal";
  return "neutral";
}

export function makeStylePlan(opts: { seed: string; intensity: Intensity; formality: number; preset: string }): StylePlan {
  const r = rng(opts.seed);
  const register = pickRegister(opts.preset, opts.formality);
  const moves = opts.intensity === "light" ? 2 : opts.intensity === "balanced" ? 3 : 4;
  return {
    register,
    opening: pickN(r, OPENINGS, 1)[0],
    structure: pickN(r, STRUCTURE, moves),
    voice: pickN(r, VOICE[register], 3),
    rhythm:
      "Let sentence length drift naturally: mostly medium, a few long, a short one only now and then. No fixed pattern, and never three consecutive sentences of similar length or shape.",
    ending: pickN(r, ENDINGS, 1)[0],
  };
}

export function renderStylePlan(p: StylePlan): string {
  return [
    "",
    "Style plan for this run (follow it silently, never mention it):",
    `- Register: ${p.register}`,
    `- Opening: ${p.opening}`,
    `- Structure: ${p.structure.join(" ")}`,
    `- Voice: ${p.voice.join(" ")}`,
    `- Rhythm: ${p.rhythm}`,
    `- Ending: ${p.ending}`,
  ].join("\n");
}
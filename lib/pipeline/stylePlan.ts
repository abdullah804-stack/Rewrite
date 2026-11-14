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

function rng(seed: string) {
  let a = createHash("sha256").update(seed).digest().readUInt32LE(0);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickN<T>(r: () => number, arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

const OPENINGS = [
  "Open with the most concrete or surprising point, not a topic sentence.",
  "Open with a short question a real reader would ask.",
  "Open with your stance in one plain sentence, as if continuing a conversation.",
  "Open with the consequence, then work back to the cause.",
  "Open with a qualified claim (using words like 'mostly', 'usually', 'in practice').",
  "Open with a specific, ordinary scenario that illustrates the main point (an illustrative example, with no invented statistics or names).",
];

const STRUCTURE = [
  "Merge two related points into one longer sentence with a subordinate clause.",
  "After a long sentence, put the key point in a very short one.",
  "Reorder the ideas so the least obvious point comes first.",
  "Drop pure filler sentences, but never a fact, number, or argument.",
  "Turn one abstract claim into a quick concrete example (illustrative only, no invented figures).",
  "Include one parenthetical aside.",
  "Use one rhetorical question in the middle of the piece, not at the end.",
  "Split one dense idea across two sentences, and fuse two thin ones into one.",
  "Use a pronoun or short reference instead of repeating the full topic phrase.",
];

const ENDINGS = [
  "End on a specific detail rather than a summary.",
  "End on a short, plain sentence that does not restate anything.",
  "End by pointing at a trade-off or an unresolved piece.",
  "End mid-argument with a qualification.",
  "Do not write a concluding moral at all; stop when the last point is made.",
];

const VOICE: Record<Register, string[]> = {
  casual: [
    "Use contractions freely.",
    "Start one or two sentences with And, But or So.",
    "Allow one mild, offhand aside.",
    "Pick informal wording fresh for this text; do not fall back on stock filler.",
    "Use at most one fragment, and only where it adds emphasis.",
  ],
  neutral: [
    "Use contractions where they sound natural.",
    "Prefer plain, everyday words over abstract nouns.",
    "Include one or two natural hedges (probably, tends to, in most cases).",
    "Include one first-person stance (such as 'I'd say' or 'my read is'), with no invented biography.",
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
      "Sentence lengths must vary a lot: some 2-6 words, some 25+. Never three consecutive sentences of similar length or shape.",
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
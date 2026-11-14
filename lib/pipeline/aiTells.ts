/**
 * aiTells.ts
 * Cheap, local, deterministic checks for the patterns AI detectors key on:
 * uniform sentence length, repeated openers, stock AI vocabulary, repeated
 * phrases/keywords, summarizing closers, and closeness to the original.
 *
 * This is NOT a detector. It is a proxy you can run on every candidate so the
 * pipeline can pick the best one and ask the model to fix specific problems.
 */

export type TellOptions = {
  /** max share of output 3-word phrases that may also appear in the original */
  maxOverlap?: number;
  /** minimum burstiness (std/mean of sentence length) for texts with >= 5 sentences */
  minBurstiness?: number;
};

export type TellReport = {
  sentences: number;
  lenMean: number;
  lenStd: number;
  burstiness: number;
  similarRuns: string[];
  starterRepeat: { word: string; count: number } | null;
  bannedHits: string[];
  repeatedTrigrams: number;
  keywordRepeats: string[];
  summaryCloser: boolean;
  stockPatterns: number;
  emDashes: number;
  overlapWithOriginal: number;
  numbersMissing: string[];
  score: number; // lower is better
  problems: string[];
};

const AI_PHRASES = [
  "furthermore", "moreover", "additionally", "ultimately", "in conclusion", "in summary",
  "to summarize", "delve", "landscape", "paramount", "tapestry", "testament", "pivotal",
  "crucial", "vital", "robust", "seamless", "seamlessly", "leverage", "leveraging", "foster",
  "underscore", "underscores", "realm", "multifaceted", "holistic", "imperative",
  "it is important to note", "it's important to note", "it is worth noting", "it's worth noting",
  "in today's", "ever-evolving", "game-changer", "unlock", "harness", "streamline",
  "comprehensive", "cutting-edge", "plays a crucial role", "a wide range of", "stands as",
  "serves as", "when it comes to", "at the end of the day", "navigate the", "shed light",
  "in the world of", "key takeaway", "dive into", "pave the way",
];
// Allowed once, flagged when overused.
const SOFT_PHRASES = ["however", "therefore", "thus", "hence", "overall", "essentially"];

const STOP = new Set(
  ("the a an and or but if then so of to in on at by for with from as is are was were be been being it its this that these those " +
    "i you we they he she them his her our your their my me us not no yes do does did have has had will would can could should may might " +
    "just very really also than too more most much many some any all each every about into over after before because while when where which who what " +
    "there here out up down off only even still such like get got make made").split(" ")
);

const CLOSER_RE =
  /\b(in conclusion|to sum up|all in all|bottom line|the takeaway|at the end of the day|in the end|when all is said)\b/i;
const STOCK_PATTERNS = [
  /\bnot (just|only|merely)\b[^.!?]{0,70}\b(but|it's|it is|they're|they are)\b/gi,
  /\bit'?s (not|never) about\b[^.!?]{0,60}\bit'?s about\b/gi,
  /\b(whether you'?re|whether it'?s)\b[^.!?]{0,60}\bor\b/gi,
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PHRASE_RES = AI_PHRASES.map((p) => ({ p, re: new RegExp(`\\b${escapeRe(p)}\\b`, "i") }));
const SOFT_RES = SOFT_PHRASES.map((p) => ({ p, re: new RegExp(`\\b${escapeRe(p)}\\b`, "gi") }));

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s*\n+\s*/g, " ")
    .split(/(?<=[.!?…]["')\]]*)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\s-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function trigrams(ws: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i <= ws.length - 3; i++) out.push(ws.slice(i, i + 3).join(" "));
  return out;
}

const wc = (s: string) => s.split(/\s+/).filter(Boolean).length;

export function analyzeText(text: string, original: string, opts: TellOptions = {}): TellReport {
  const maxOverlap = opts.maxOverlap ?? 0.2;
  const minBurst = opts.minBurstiness ?? 0.55;

  const sents = splitSentences(text);
  const lens = sents.map(wc);
  const n = lens.length;
  const mean = n ? lens.reduce((a, b) => a + b, 0) / n : 0;
  const std = n ? Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / n) : 0;
  const burstiness = mean > 0 ? std / mean : 0;

  // runs of 3+ consecutive sentences with near-identical length
  const similarRuns: string[] = [];
  let runStart = 0;
  for (let i = 1; i <= n; i++) {
    const continues = i < n && Math.abs(lens[i] - lens[i - 1]) <= 3;
    if (!continues) {
      if (i - runStart >= 3) similarRuns.push(sents.slice(runStart, i).join(" / ").slice(0, 260));
      runStart = i;
    }
  }

  // repeated sentence openers
  const starters = new Map<string, number>();
  for (const s of sents) {
    const w = words(s)[0];
    if (w) starters.set(w, (starters.get(w) ?? 0) + 1);
  }
  const starterLimit = Math.max(2, Math.ceil(n / 4));
  let starterRepeat: TellReport["starterRepeat"] = null;
  for (const [word, count] of starters) {
    if (count > starterLimit && (!starterRepeat || count > starterRepeat.count)) starterRepeat = { word, count };
  }

  // stock vocabulary
  const bannedHits = PHRASE_RES.filter(({ re }) => re.test(text)).map(({ p }) => p);
  for (const { p, re } of SOFT_RES) {
    const m = text.match(re);
    if (m && m.length > 1) bannedHits.push(`${p} (x${m.length})`);
  }

  // repeated phrases / keywords
  const ws = words(text);
  const tgCount = new Map<string, number>();
  for (const tg of trigrams(ws)) {
    const parts = tg.split(" ");
    if (parts.every((p) => STOP.has(p))) continue;
    tgCount.set(tg, (tgCount.get(tg) ?? 0) + 1);
  }
  const repeatedTrigrams = [...tgCount.values()].filter((c) => c >= 2).length;

  const kwCount = new Map<string, number>();
  for (const w of ws) if (w.length >= 6 && !STOP.has(w)) kwCount.set(w, (kwCount.get(w) ?? 0) + 1);
  const kwLimit = Math.max(3, Math.ceil(ws.length / 70));
  const keywordRepeats = [...kwCount.entries()].filter(([, c]) => c > kwLimit).map(([w, c]) => `${w} (x${c})`);

  const last = sents[n - 1] ?? "";
  const summaryCloser = n >= 4 && CLOSER_RE.test(last);

  let stockPatterns = 0;
  for (const re of STOCK_PATTERNS) stockPatterns += (text.match(re) ?? []).length;
  const emDashes = (text.match(/—/g) ?? []).length;

  // closeness to the original
  const origTg = new Set(trigrams(words(original)));
  const outTg = trigrams(ws);
  const shared = outTg.filter((t) => origTg.has(t)).length;
  const overlapWithOriginal = outTg.length ? shared / outTg.length : 0;

  // facts: every number in the original must survive
  const nums = (original.match(/\d[\d,.]*\d|\d/g) ?? []).map((x) => x.replace(/[,.]$/, ""));
  const numbersMissing = [...new Set(nums)].filter((x) => !text.includes(x));

  const problems: string[] = [];
  if (n >= 5 && burstiness < minBurst)
    problems.push(
      `Sentence lengths are too uniform (variation ${burstiness.toFixed(2)}, want at least ${minBurst}). Make a few sentences very short (2-6 words) and let one or two run long (25+ words) by merging related points.`
    );
  if (similarRuns.length)
    problems.push(
      `These consecutive sentences have nearly the same length and shape. Merge, split, or reshape them: ${similarRuns.map((r) => `"${r}"`).join(" | ")}`
    );
  if (starterRepeat)
    problems.push(`Too many sentences start with "${starterRepeat.word}" (${starterRepeat.count} times). Vary the openers.`);
  if (bannedHits.length) problems.push(`Replace these stock AI words/phrases with plain wording: ${bannedHits.join(", ")}.`);
  if (repeatedTrigrams > 2) problems.push(`The same short phrases repeat ${repeatedTrigrams} times. Reword the repeats.`);
  if (keywordRepeats.length)
    problems.push(`Overused keywords: ${keywordRepeats.join(", ")}. Use pronouns, shorter references, or synonyms after first mention.`);
  if (summaryCloser) problems.push(`The last sentence is a summarizing moral. End on a specific detail or a plain short sentence instead.`);
  if (stockPatterns) problems.push(`Remove "not just X, but Y" / "whether you're X or Y" style constructions (${stockPatterns} found).`);
  if (emDashes > 1) problems.push(`Remove em dashes (${emDashes} found). Use commas, periods or parentheses.`);
  if (overlapWithOriginal > maxOverlap)
    problems.push(
      `${Math.round(overlapWithOriginal * 100)}% of 3-word phrases are copied from the original. Restructure the sentences rather than swapping words.`
    );

  const score =
    (n >= 5 && burstiness < minBurst ? (minBurst - burstiness) * 10 : 0) +
    similarRuns.length * 1.5 +
    (starterRepeat ? starterRepeat.count - starterLimit : 0) +
    bannedHits.length * 2 +
    Math.max(0, repeatedTrigrams - 2) * 0.5 +
    keywordRepeats.length +
    (summaryCloser ? 1.5 : 0) +
    stockPatterns +
    Math.max(0, emDashes - 1) * 0.5 +
    Math.max(0, overlapWithOriginal - maxOverlap) * 10 +
    numbersMissing.length * 5;

  return {
    sentences: n,
    lenMean: mean,
    lenStd: std,
    burstiness,
    similarRuns,
    starterRepeat,
    bannedHits,
    repeatedTrigrams,
    keywordRepeats,
    summaryCloser,
    stockPatterns,
    emDashes,
    overlapWithOriginal,
    numbersMissing,
    score,
    problems,
  };
}
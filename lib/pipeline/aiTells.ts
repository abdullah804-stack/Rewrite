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
  copiedBigrams: string[];
  personaInserts: string[];
  mirrorsOriginal: boolean;
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


// "Fake casual" insertions. Detectors trained on humanizer output recognise these,
// and they read as commentary about the writer instead of the subject.
const PERSONA_RES: RegExp[] = [
  /\bso yeah\b/i, /\bi get why\b/i, /\bheavy lifting\b/i, /\b(?:a )?(?:big|huge) deal\b/i,
  /\bhonestly\b/i, /\bhere'?s the thing\b/i,
  /\bthe thing is\b/i, /\bto be (?:fair|honest)\b/i, /\bfrankly\b/i, /\blet'?s be real\b/i,
  /\bat its core\b/i, /\bdrives me crazy\b/i, /\ba total mess\b/i, /\bit sucks\b/i,
  /\bmakes? (?:a )?(?:lot of )?sense to me\b/i, /\b(?:though|but|and) i'?d say\b/i,
  /\bmy (?:read|take) is\b/i, /\bif you ask me\b/i, /\bbasically\b/i,
  /\bgenuinely\b/i, /\blook,\s/i,
  // structural (topic-independent): first-person parenthetical aside, or commentary on one's own wording
  /\([^)]{0,80}\b(?:me|my|i|i'm|i'd)\b[^)]{0,80}\)/i,
  /["“][^"”]{3,40}["”]\s+(?:is|are)\s+(?:doing|carrying|a bit|a little)\b/i,
];

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


const stem = (w: string) => w.slice(0, 6);
function contentSet(s: string): Set<string> {
  return new Set(words(s).filter((w) => w.length >= 4 && !STOP.has(w)).map(stem));
}
function contentBigrams(text: string): string[] {
  const ws = words(text);
  const out: string[] = [];
  for (let i = 0; i < ws.length - 1; i++) {
    const a = ws[i], b = ws[i + 1];
    if (a.length >= 4 && b.length >= 4 && !STOP.has(a) && !STOP.has(b)) out.push(`${a} ${b}`);
  }
  return out;
}
/** true when output sentences map one-to-one, in order, onto the original's sentences */
function mirrorsOrder(outS: string[], origS: string[]): boolean {
  if (outS.length < 4 || origS.length < 4) return false;
  const oSets = origS.map(contentSet);
  const idx: number[] = [];
  for (const s of outS) {
    const set = contentSet(s);
    if (!set.size) continue;
    let best = -1, bestScore = 0.1;
    oSets.forEach((o, i) => {
      let inter = 0;
      set.forEach((x) => { if (o.has(x)) inter++; });
      const jac = inter / (set.size + o.size - inter);
      if (jac > bestScore) { bestScore = jac; best = i; }
    });
    if (best >= 0) idx.push(best);
  }
  if (idx.length < 4) return false;
  let ordered = 0;
  for (let i = 1; i < idx.length; i++) if (idx[i] >= idx[i - 1]) ordered++;
  const distinct = new Set(idx).size;
  return ordered / (idx.length - 1) >= 0.85 && distinct >= Math.ceil(origS.length * 0.7);
}

export function analyzeText(text: string, original: string, opts: TellOptions = {}): TellReport {
  const maxOverlap = opts.maxOverlap ?? 0.2;
  const minBurst = opts.minBurstiness ?? 0.4;

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


  // copied terminology, persona filler, structure mirroring
  const origBg = new Set(contentBigrams(original));
  const copiedBigrams = [...new Set(contentBigrams(text).filter((b) => origBg.has(b)))];
  const personaInserts = PERSONA_RES.map((re) => text.match(re)?.[0]).filter((x): x is string => !!x);
  const mirrorsOriginal = mirrorsOrder(sents, splitSentences(original));

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

  if (copiedBigrams.length > 2)
    problems.push(`These word pairs are copied from the original; say them differently: ${copiedBigrams.slice(0, 8).join(", ")}.`);
  if (personaInserts.length > 1)
    problems.push(
      `Remove filler that sounds like inserted casualness (${personaInserts.join(", ")}). Voice should come from word choice, rhythm and opinions about the subject, never from commentary about yourself or your own sentences.`
    );
  if (mirrorsOriginal)
    problems.push(`The sentences follow the original one-to-one, in the same order. Lead with a different point, and merge or split so it is not one sentence per original sentence.`);

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
    Math.max(0, copiedBigrams.length - 2) +
    Math.max(0, personaInserts.length - 1) * 2 +
    (mirrorsOriginal ? 2 : 0) +
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
    copiedBigrams,
    personaInserts,
    mirrorsOriginal,
    numbersMissing,
    score,
    problems,
  };
}

// THE UNIVERSAL AI-DETECTOR KILLER
// This doesn't care about the topic. It mechanically breaks AI sentence structures.
export function injectStructuralChaos(text: string): string {
  let result = text;

  // 1. FORCE SENTENCE FRAGMENTS
  // Find sentences that start with "If", "When", or "Because" and cut them in half.
  result = result.replace(/\b(If|When|Because) ([^,]{10,40}), ([^.!?]{10,60}[.!?])/gi, "$1 $2. $3");

  // 2. FORCE RUN-ON SENTENCES
  // Replace 20% of periods with a comma and a conjunction.
  result = result.replace(/\.\s+([A-Z])/g, (match, letter) => {
    if (Math.random() < 0.2) {
      const conjunctions = [", but ", ", and ", ", so ", "; "];
      const conj = conjunctions[Math.floor(Math.random() * conjunctions.length)];
      return conj + letter.toLowerCase();
    }
    return match;
  });

  // 3. DESTROY THE FIRST SENTENCE
  // AI always starts with a perfect summary. Let's force a conversational opener.
  const sentences = result.split(/(?<=[.!?])\s+/);
  if (sentences.length > 1) {
    const openers = ["Honestly, ", "Look, ", "I'll be blunt: ", "Here's the thing: ", "Basically, "];
    const randomOpener = openers[Math.floor(Math.random() * openers.length)];
    sentences[0] = randomOpener + sentences[0].charAt(0).toLowerCase() + sentences[0].slice(1);
  }

  // 4. KILL THE TIDY CONCLUSION
  // AI always ends with "In conclusion" or "Ultimately". Delete those.
  const lastIndex = sentences.length - 1;
  if (lastIndex > 0) {
    sentences[lastIndex] = sentences[lastIndex]
      .replace(/^(In conclusion|Ultimately|To sum up|Thus|Therefore),?\s*/i, "")
      .replace(/^([A-Z])/, (m) => m.toLowerCase());
  }

  // 5. INSERT RANDOM PARENTHETICALS
  // Humans add side thoughts. We will inject one into a random sentence.
  if (sentences.length > 2) {
    const sideThoughts = ["(which is crazy)", "(at least in my experience)", "(believe it or not)", "(and that's the scary part)"];
    const randomThought = sideThoughts[Math.floor(Math.random() * sideThoughts.length)];
    const midIndex = Math.floor(sentences.length / 2);
    sentences[midIndex] = sentences[midIndex].replace(/\.\s*$/, ` ${randomThought}.`);
  }

  return sentences.join(" ");
}
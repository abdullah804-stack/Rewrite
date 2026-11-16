/**
 * aiTells.ts
 * Cheap, local, deterministic checks for the patterns AI detectors key on.
 */

export type TellOptions = {
  maxOverlap?: number;
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
  score: number;
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

const PERSONA_RES: RegExp[] = [
  /\bso yeah\b/i, /\bi get why\b/i, /\bheavy lifting\b/i, /\b(?:a )?(?:big|huge) deal\b/i,
  /\bhonestly\b/i, /\bhere'?s the thing\b/i, /\bthe thing is\b/i, /\bto be (?:fair|honest)\b/i,
  /\bfrankly\b/i, /\blet'?s be real\b/i, /\bat its core\b/i, /\bdrives me crazy\b/i,
  /\ba total mess\b/i, /\bit sucks\b/i, /\bmakes? (?:a )?(?:lot of )?sense to me\b/i,
  /\b(?:though|but|and) i'?d say\b/i, /\bmy (?:read|take) is\b/i, /\bif you ask me\b/i,
  /\bbasically\b/i, /\bgenuinely\b/i, /\blook,\s/i,
];

export function splitSentences(text: string): string[] {
  return text.replace(/\s*\n+\s*/g, " ").split(/(?<=[.!?…]["')\]]*)\s+/).map((s) => s.trim()).filter(Boolean);
}

function words(s: string): string[] {
  return s.toLowerCase().replace(/[^\p{L}\p{N}'\s-]/gu, " ").split(/\s+/).filter(Boolean);
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

  const similarRuns: string[] = [];
  let runStart = 0;
  for (let i = 1; i <= n; i++) {
    const continues = i < n && Math.abs(lens[i] - lens[i - 1]) <= 3;
    if (!continues) {
      if (i - runStart >= 3) similarRuns.push(sents.slice(runStart, i).join(" / ").slice(0, 260));
      runStart = i;
    }
  }

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

  const bannedHits = PHRASE_RES.filter(({ re }) => re.test(text)).map(({ p }) => p);
  for (const { p, re } of SOFT_RES) {
    const m = text.match(re);
    if (m && m.length > 1) bannedHits.push(`${p} (x${m.length})`);
  }

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

  const origTg = new Set(trigrams(words(original)));
  const outTg = trigrams(ws);
  const shared = outTg.filter((t) => origTg.has(t)).length;
  const overlapWithOriginal = outTg.length ? shared / outTg.length : 0;

  const origBg = new Set(contentBigrams(original));
  const copiedBigrams = [...new Set(contentBigrams(text).filter((b) => origBg.has(b)))];
  const personaInserts = PERSONA_RES.map((re) => text.match(re)?.[0]).filter((x): x is string => !!x);
  const mirrorsOriginal = mirrorsOrder(sents, splitSentences(original));

  const nums = (original.match(/\d[\d,.]*\d|\d/g) ?? []).map((x) => x.replace(/[,.]$/, ""));
  const numbersMissing = [...new Set(nums)].filter((x) => !text.includes(x));

  const problems: string[] = [];
  if (n >= 5 && burstiness < minBurst) problems.push(`Sentence lengths are too uniform. Make a few very short and one or two very long.`);
  if (similarRuns.length) problems.push(`These sentences have the same length and shape. Merge, split, or reshape them.`);
  if (starterRepeat) problems.push(`Too many sentences start with "${starterRepeat.word}". Vary the openers.`);
  if (bannedHits.length) problems.push(`Replace these stock AI words: ${bannedHits.join(", ")}.`);
  if (repeatedTrigrams > 2) problems.push(`The same short phrases repeat. Reword the repeats.`);
  if (keywordRepeats.length) problems.push(`Overused keywords: ${keywordRepeats.join(", ")}. Use pronouns or synonyms.`);
  if (summaryCloser) problems.push(`The last sentence is a summarizing moral. End on a specific detail.`);
  if (stockPatterns) problems.push(`Remove "not just X, but Y" constructions.`);
  if (emDashes > 1) problems.push(`Remove em dashes.`);
  if (overlapWithOriginal > maxOverlap) problems.push(`Too much copied phrasing. Restructure the sentences.`);
  if (copiedBigrams.length > 2) problems.push(`These word pairs are copied from the original; say them differently.`);
  if (personaInserts.length > 1) problems.push(`Remove filler that sounds like inserted casualness.`);
  if (mirrorsOriginal) problems.push(`The sentences follow the original one-to-one. Lead with a different point.`);

  const score =
    (n >= 5 && burstiness < minBurst ? (minBurst - burstiness) * 10 : 0) +
    similarRuns.length * 1.5 + (starterRepeat ? starterRepeat.count - starterLimit : 0) +
    bannedHits.length * 2 + Math.max(0, repeatedTrigrams - 2) * 0.5 + keywordRepeats.length +
    (summaryCloser ? 1.5 : 0) + stockPatterns + Math.max(0, emDashes - 1) * 0.5 +
    Math.max(0, overlapWithOriginal - maxOverlap) * 10 + Math.max(0, copiedBigrams.length - 2) +
    Math.max(0, personaInserts.length - 1) * 2 + (mirrorsOriginal ? 2 : 0) + numbersMissing.length * 5;

  return {
    sentences: n, lenMean: mean, lenStd: std, burstiness, similarRuns, starterRepeat,
    bannedHits, repeatedTrigrams, keywordRepeats, summaryCloser, stockPatterns, emDashes,
    overlapWithOriginal, copiedBigrams, personaInserts, mirrorsOriginal, numbersMissing, score, problems,
  };
}

// ---------------------------------------------------------------------------
// GROUP 1: Vocabulary Analyzer (Checks for repetitive words and generic phrasing)
// ---------------------------------------------------------------------------
export function analyzeVocabulary(text: string): { warnings: string[], topKeywords: string[] } {
  const warnings: string[] = [];
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? [];
  const wordCounts: Record<string, number> = {};
  const stopwords = new Set(["that", "with", "this", "from", "have", "were", "they", "will", "would", "there", "their", "what", "about", "which", "when", "make", "like", "time", "just", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "other", "than", "then", "look", "only", "come", "over", "think", "also", "back", "after", "work", "first", "well", "even", "want", "because", "these", "give", "most"]);

  for (const w of words) {
    if (!stopwords.has(w)) wordCounts[w] = (wordCounts[w] || 0) + 1;
  }

  const sortedWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]);
  const topKeywords = sortedWords.slice(0, 3).filter(([_, count]) => count >= 4).map(([word]) => word);

  if (topKeywords.length > 0) {
    warnings.push(`REPETITIVE KEYWORDS DETECTED: The words "${topKeywords.join('", "')}" are used too frequently. You MUST use pronouns or synonyms for these words in the rewrite.`);
  }

  const genericPhrases = ["vital role", "crucial role", "wide range", "various stakeholders", "important to note", "in today's world", "plays a key role", "multifaceted issue", "significant impact", "rapidly evolving"];
  const foundGeneric = genericPhrases.filter(p => text.toLowerCase().includes(p));
  if (foundGeneric.length > 0) {
    warnings.push(`GENERIC PHRASES DETECTED: You are strictly FORBIDDEN from using: "${foundGeneric.join('", "')}". Replace them with specific details.`);
  }

  const uniqueWords = new Set(words).size;
  if ((uniqueWords / Math.max(words.length, 1)) < 0.4) {
    warnings.push(`LOW VOCABULARY VARIATION: The text repeats too many words. You must choose unexpected synonyms.`);
  }

  return { warnings, topKeywords };
}

// ---------------------------------------------------------------------------
// THE DE-POLISHER (Applies structural rules after the AI writes)
// ---------------------------------------------------------------------------
export function dePolishText(text: string): string {
  let result = text;

  // Rule #14, #26, #27: Kill Template Transitions and Intro/Outros
  const bannedTransitions = [
    /In conclusion,?/gi, /Ultimately,?/gi, /Furthermore,?/gi, 
    /Moreover,?/gi, /Additionally,?/gi, /Consequently,?/gi,
    /In today's.*?(world|landscape|economy),?/gi,
    /It is (crucial|important|essential) to (note|understand)( that)?/gi
  ];
  bannedTransitions.forEach(regex => { result = result.replace(regex, ""); });

  // Rule #22: Kill Overly Polished / Formal Language
  const formalToCasual: Record<string, string> = {
    "utilize": "use", "utilizing": "using", "utilized": "used",
    "implement": "build", "implementing": "building", "implemented": "built",
    "facilitate": "help", "facilitating": "helping",
    "endeavor": "try", "comprehensive": "full", "paradigm": "model",
    "crucial": "key", "essential": "needed", "foster": "create",
    "subsequently": "later", "prior to": "before", "in order to": "to"
  };
  for (const [formal, plain] of Object.entries(formalToCasual)) {
    result = result.replace(new RegExp(`\\b${formal}\\b`, "gi"), plain);
  }

  // Rule #9: Break Uniform Sentence Length (Burstiness)
  result = result.replace(/([^.!?]{22,}),\s+([^.!?]{10,})/g, (match, firstHalf, secondHalf) => {
    return `${firstHalf}. ${secondHalf.charAt(0).toUpperCase() + secondHalf.slice(1)}`;
  });

  // Rule #12: Predictable Sentence Endings
  result = result.replace(/ (in the long run|for years to come|and much more)\./gi, ".");
  
  // Rule #15: Unnaturally smooth flow (Insert a conversational aside)
  const sentences = result.split(/(?<=[.!?])\s+/);
  if (sentences.length > 2) {
    const asides = ["(which is crazy)", "(honestly)", "(not what I expected)", "(at least on paper)"];
    const randomAside = asides[Math.floor(Math.random() * asides.length)];
    sentences[1] = sentences[1].replace(/\.$/, ` ${randomAside}.`);
  }

  // Rule #10, #13: Repeat grammatical structures
  if (sentences.length > 0) {
    const lastIdx = sentences.length - 1;
    sentences[lastIdx] = sentences[lastIdx].replace(/\.$/, ". Simple.");
  }

  return sentences.join(" ");
}
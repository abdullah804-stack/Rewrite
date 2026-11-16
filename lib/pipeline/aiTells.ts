/**
 * aiTells.ts
 * Local, deterministic checks and structural manipulation for AI detectors.
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
// GROUP 1: Vocabulary Analyzer
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
    warnings.push(`REPETITIVE KEYWORDS DETECTED: You are using the words "${topKeywords.join('", "')}" too frequently. You MUST use pronouns (it, they, this) or specific synonyms for these words after their first mention.`);
  }

  const genericPhrases = ["vital role", "crucial role", "wide range", "various stakeholders", "important to note", "in today's world", "plays a key role", "multifaceted issue", "significant impact", "rapidly evolving"];
  const foundGeneric = genericPhrases.filter(p => text.toLowerCase().includes(p));
  if (foundGeneric.length > 0) {
    warnings.push(`GENERIC PHRASES DETECTED: You are strictly FORBIDDEN from using: "${foundGeneric.join('", "')}". Replace them with specific, named examples or numbers.`);
  }

  const uniqueWords = new Set(words).size;
  if ((uniqueWords / Math.max(words.length, 1)) < 0.4) {
    warnings.push(`LOW VOCABULARY VARIATION: The text repeats too many words. You MUST choose unexpected synonyms and avoid repeating sentence structures.`);
  }

  return { warnings, topKeywords };
}

// ---------------------------------------------------------------------------
// THE DE-POLISHER (Applies structural rules after the AI writes)
// ---------------------------------------------------------------------------
export function dePolishText(text: string, topKeywords: string[] = []): string {
  let result = text;

  // --- GROUP 1: PHYSICALLY ENFORCE KEYWORD REMOVAL ---
  if (topKeywords.length > 0) {
    topKeywords.forEach((kw, index) => {
      let count = 0;
      const synonyms = ["it", "this", "they", "these efforts", "the strategy"];
      const replacement = synonyms[index % synonyms.length];
      
      const regex = new RegExp(`\\b${kw}\\b`, "gi");
      result = result.replace(regex, (match) => {
        count++;
        if (count === 1) return match; 
        return replacement;
      });
    });
  }

  // --- GROUP 1: SWAP "SAFE" ADJECTIVES FOR "WEIRD" ONES ---
  const safeAdjectives: Record<string, string[]> = {
    "important": ["crucial", "vital", "key", "heavy"],
    "good": ["decent", "solid", "fine", "sharp"],
    "bad": ["messy", "awful", "sloppy", "rough"],
    "big": ["massive", "hefty", "huge", "wild"],
    "small": ["tiny", "slim", "modest", "bare"],
    "significant": ["sharp", "heavy", "real", "wild"],
    "effective": ["sharp", "solid", "lean", "tight"],
    "difficult": ["rough", "uphill", "messy", "brutal"],
    "easy": ["simple", "quick", "cheap", "breezy"],
    "beautiful": ["stunning", "lovely", "vivid", "wild"],
    "interesting": ["sharp", "wild", "odd", "gripping"],
    "useful": ["handy", "practical", "sharp", "lean"],
    "positive": ["bright", "good", "solid", "upbeat"],
    "negative": ["dark", "rough", "messy", "brutal"]
  };

  for (const [safe, weirdArray] of Object.entries(safeAdjectives)) {
    const regex = new RegExp(`\\b${safe}\\b`, "gi");
    result = result.replace(regex, () => {
      if (Math.random() < 0.3) {
        return weirdArray[Math.floor(Math.random() * weirdArray.length)];
      }
      return safe;
    });
  }

  // --- GROUP 5: KILL HEDGING WORDS ---
  result = result.replace(/\b(may|might|could|possibly|perhaps|potentially|generally|typically|often)\b/gi, "");
  result = result.replace(/\s{2,}/g, " "); 

  // --- GROUP 4: KILL REPEATED IDEAS ---
  let sentences = result.split(/(?<=[.!?])\s+/);
  const dedupedSentences = [];
  for (let i = 0; i < sentences.length; i++) {
    if (i > 0 && sentences[i].length > 20 && sentences[i - 1].length > 20) {
      const prevWords = new Set(sentences[i - 1].toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
      const currWords = (sentences[i].toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
      let matches = 0;
      currWords.forEach(w => { if (prevWords.has(w)) matches++; });
      
      if (matches / currWords.length > 0.6) {
        continue; 
      }
    }
    dedupedSentences.push(sentences[i]);
  }
  result = dedupedSentences.join(" ");

  // --- GROUP 3: KILL LISTS ---
  if (result.includes("- ") || result.includes("* ") || result.match(/^\d+\.\s/m)) {
    result = result.replace(/^[\-\*\d\.]+\s+/gm, ""); 
    result = result.replace(/\n/g, " "); 
  }

  // --- GROUP 3: KILL PREDICTABLE PARAGRAPH OPENINGS ---
  const bannedOpenings = [
    /^One of the key aspects?/i, /^When it comes to/i, /^Another important factor/i, 
    /^It is worth noting/i, /^In terms of/i, /^The first thing to note/i
  ];
  const paragraphs = result.split(/\n{2,}/);
  const cleanedParagraphs = paragraphs.map(p => {
    let cleanP = p.trim();
    for (const regex of bannedOpenings) {
      cleanP = cleanP.replace(regex, "Here's the reality:");
    }
    return cleanP;
  });
  result = cleanedParagraphs.join("\n\n");

  // --- GROUPS 1 & 2: TRANSITIONS & FORMAL LANGUAGE ---
  const bannedTransitions = [
    /In conclusion,?/gi, /Ultimately,?/gi, /Furthermore,?/gi, 
    /Moreover,?/gi, /Additionally,?/gi, /Consequently,?/gi,
    /In today's.*?(world|landscape|economy),?/gi,
    /It is (crucial|important|essential) to (note|understand)( that)?/gi
  ];
  bannedTransitions.forEach(regex => { result = result.replace(regex, ""); });

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

  // --- GROUP 2: DESTROY REPETITIVE SENTENCE PATTERNS (Rule #7) ---
  sentences = result.split(/(?<=[.!?])\s+/);
  let subjectCount = 0;
  for (let i = 0; i < sentences.length; i++) {
    if (/^(I|We|The|A|An|This|That|It|They|He|She|Companies|Organizations|People|Users|Managers)\b/i.test(sentences[i])) {
      subjectCount++;
      if (subjectCount >= 2) {
        const preps = ["In this case, ", "From a practical view, ", "Across the board, ", "Beyond that, ", "Without a doubt, "];
        const randomPrep = preps[Math.floor(Math.random() * preps.length)];
        sentences[i] = randomPrep + sentences[i].charAt(0).toLowerCase() + sentences[i].slice(1);
        subjectCount = 0; 
      }
    } else {
      subjectCount = 0;
    }
  }
  result = sentences.join(" ");

  // --- GROUP 2: SPLIT SENTENCES TO BREAK RHYTHM (Rule #8) ---
  // Find sentences with a comma and split them in half.
  result = result.replace(/([^.!?]{15,}),\s+([^.!?]{10,})/g, (match, firstHalf, secondHalf) => {
    return `${firstHalf}. ${secondHalf.charAt(0).toUpperCase() + secondHalf.slice(1)}`;
  });

  // --- GROUP 2: FORCE A SHORT SENTENCE (Rule #6) ---
  sentences = result.split(/(?<=[.!?])\s+/);
  let hasShortSentence = false;
  for (const s of sentences) {
    if (s.split(/\s+/).length <= 5) { hasShortSentence = true; break; }
  }

  // If no short sentence exists, find the longest sentence, cut the last 3 words off, and make them a fragment.
  if (!hasShortSentence && sentences.length > 2) {
    let longestIdx = 0, maxLen = 0;
    sentences.forEach((s, i) => { if (s.length > maxLen) { maxLen = s.length; longestIdx = i; } });
    
    const wordsArr = sentences[longestIdx].split(" ");
    if (wordsArr.length > 8) {
      const cutIdx = wordsArr.length - 4;
      sentences[longestIdx] = wordsArr.slice(0, cutIdx).join(" ") + ".";
      sentences.splice(longestIdx + 1, 0, wordsArr.slice(cutIdx).join(" ") + ".");
    }
  }
  result = sentences.join(" ");

  // --- GROUP 3: INSERT RANDOM PARENTHETICALS & ENDINGS ---
  sentences = result.split(/(?<=[.!?])\s+/);
  if (sentences.length > 2) {
    const asides = ["(which is crazy)", "(honestly)", "(not what I expected)", "(at least on paper)"];
    const randomAside = asides[Math.floor(Math.random() * asides.length)];
    const targetIdx = sentences.length > 3 ? 2 : 1;
    sentences[targetIdx] = sentences[targetIdx].replace(/\.$/, ` ${randomAside}.`);
  }

  if (sentences.length > 0) {
    const lastIdx = sentences.length - 1;
    sentences[lastIdx] = sentences[lastIdx].replace(/\.$/, ". Simple.");
  }

  if (!result.includes(";")) {
    sentences = sentences.join(" ").split(/(?<=[.!?])\s+/);
    for (let i = 0; i < sentences.length; i++) {
      if (sentences[i].includes(", but ")) {
        sentences[i] = sentences[i].replace(", but ", "; ");
        break;
      }
    }
  }

  let finalParas = sentences.join(" ").split(/\n{2,}/);
  if (finalParas.length > 1 && finalParas[1].split(/(?<=[.!?])\s+/).length > 2) {
    const pSentences = finalParas[1].split(/(?<=[.!?])\s+/);
    finalParas[1] = pSentences[0] + "\n\n" + pSentences.slice(1).join(" ");
  }

  return finalParas.join("\n\n");
}
export type Metrics = {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  sentenceLenMean: number;
  sentenceLenSd: number;
  paragraphLenMean: number;
  contractionRate: number;
  firstPersonRate: number;
  questionRate: number;
  exclamationRate: number;
  emDashPer1k: number;
  semicolonPer1k: number;
  commaPer1k: number;
  readingGrade: number;
};

// Step 13: Multilingual support (Audit §9D)
// Uses Intl.Segmenter when available for language-aware splitting.
// Falls back to a permissive regex that doesn't require uppercase letters.
export function splitSentences(text: string): string[] {
  const normalized = text.replace(/\n+/g, " ").trim();
  if (!normalized) return [];

  // Try Intl.Segmenter (built into Node 16+ and modern browsers)
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const segmenter = new (Intl as any).Segmenter("en", { granularity: "sentence" });
      const segments = Array.from(segmenter.segment(normalized)) as { segment: string }[];
      return segments
        .map((s) => s.segment.trim())
        .filter((s) => s.length > 0);
    } catch {
      // Fall through to regex
    }
  }

  // Fallback: split on punctuation followed by whitespace (no uppercase required)
  return normalized
    .split(/(?<=[.!?])\s+/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function splitWords(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/).filter((w) => w.length > 0);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance =
    values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function countMatches(text: string, regex: RegExp): number {
  const re = new RegExp(regex.source, regex.flags);
  const matches = text.match(re);
  return matches ? matches.length : 0;
}

function countPer1k(count: number, wordCount: number): number {
  if (wordCount === 0) return 0;
  return (count / wordCount) * 1000;
}

const CONTRACTIONS = /\b\w+'(?:s|t|re|ve|ll|d|m)\b/gi;
const FIRST_PERSON = /\b(?:I|I'm|I've|I'll|I'd|me|my|mine|we|we're|we've|us|our|ours)\b/g;

function estimateSyllables(text: string): number {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) ?? [];
  let total = 0;
  for (const word of words) {
    total += countSyllablesInWord(word);
  }
  return total;
}

function countSyllablesInWord(word: string): number {
  if (word.length <= 3) return 1;
  const trimmed = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const matches = trimmed.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

// Step 13: Check if the text is likely English. If not, skip the English-only
// Flesch-Kincaid formula and return 0.
function isLikelyEnglish(text: string): boolean {
  const sample = text.slice(0, 1000);
  if (sample.length === 0) return true;
  
  // Count ASCII letters vs total characters (excluding whitespace)
  const chars = sample.replace(/\s/g, "");
  if (chars.length === 0) return true;
  
  const asciiLetters = (chars.match(/[a-zA-Z]/g) ?? []).length;
  const ratio = asciiLetters / chars.length;
  
  // If less than 60% of non-whitespace characters are ASCII letters, 
  // it's probably not English (e.g., French accents, Chinese, Arabic, etc.)
  return ratio > 0.6;
}

export function fleschKincaidGrade(text: string): number {
  if (!isLikelyEnglish(text)) return 0;

  const sentences = splitSentences(text).length;
  const words = splitWords(text).length;
  if (sentences === 0 || words === 0) return 0;
  const syllables = estimateSyllables(text);
  return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
}

export function computeMetrics(text: string): Metrics {
  const words = splitWords(text);
  const sentences = splitSentences(text);
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const wordCount = words.length;
  const sentenceLengths = sentences.map((s) => splitWords(s).length);
  const paragraphLengths = paragraphs.map((p) => splitWords(p).length);

  const contractionCount = countMatches(text, CONTRACTIONS);
  const firstPersonCount = countMatches(text, FIRST_PERSON);
  const questionCount = countMatches(text, /\?/g);
  const exclamationCount = countMatches(text, /!/g);
  const emDashCount = countMatches(text, /—/g);
  const semicolonCount = countMatches(text, /;/g);
  const commaCount = countMatches(text, /,/g);

  const contractionDenom = Math.max(wordCount, 1);
  const sentenceDenom = Math.max(sentences.length, 1);

  return {
    wordCount,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    sentenceLenMean: Number(mean(sentenceLengths).toFixed(2)),
    sentenceLenSd: Number(stdDev(sentenceLengths).toFixed(2)),
    paragraphLenMean: Number(mean(paragraphLengths).toFixed(2)),
    contractionRate: Number((contractionCount / contractionDenom).toFixed(3)),
    firstPersonRate: Number((firstPersonCount / contractionDenom).toFixed(3)),
    questionRate: Number((questionCount / sentenceDenom).toFixed(3)),
    exclamationRate: Number((exclamationCount / sentenceDenom).toFixed(3)),
    emDashPer1k: Number(countPer1k(emDashCount, wordCount).toFixed(2)),
    semicolonPer1k: Number(countPer1k(semicolonCount, wordCount).toFixed(2)),
    commaPer1k: Number(countPer1k(commaCount, wordCount).toFixed(2)),
    readingGrade: Number(fleschKincaidGrade(text).toFixed(1)),
  };
}

export function styleDistance(a: Metrics, b: Metrics): number {
  const norm = (x: number, max: number) => Math.min(x / max, 1);

  const diffs = [
    Math.abs(norm(a.sentenceLenMean, 40) - norm(b.sentenceLenMean, 40)),
    Math.abs(norm(a.sentenceLenSd, 20) - norm(b.sentenceLenSd, 20)),
    Math.abs(norm(a.contractionRate, 0.1) - norm(b.contractionRate, 0.1)),
    Math.abs(norm(a.firstPersonRate, 0.1) - norm(b.firstPersonRate, 0.1)),
    Math.abs(norm(a.emDashPer1k, 20) - norm(b.emDashPer1k, 20)),
    Math.abs(norm(a.readingGrade, 18) - norm(b.readingGrade, 18)),
  ];

  return Number((diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(3));
}
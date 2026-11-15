/**
 * Cuts reference passages out of a longer text, word for word.
 * Used by scripts/build-exemplars.ts. Pure and side-effect free so it can be tested.
 */
import { splitSentences } from "../pipeline/aiTells";

export const MIN_PASSAGE_WORDS = 45;
export const MAX_PASSAGE_WORDS = 95;
export const MAX_PASSAGE_CHARS = 480;

const wc = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Longest single sentence a reference passage may contain. */
export const MAX_SENTENCE_WORDS = 60;

/** Why a candidate passage is unusable as a reference, or null when it is fine. */
export function rejectReason(chunk: string): string | null {
  if (!/^[A-Z]/.test(chunk)) return "does not start at a sentence start";
  if (/["\u201c\u201d]/.test(chunk)) return "dialogue or quotation";
  if (/[\[\]_{}<>|*#^~]/.test(chunk)) return "markup or scan-error characters";
  if (/\w- [a-z]/.test(chunk)) return "line-break hyphenation left by scanning";
  if ((chunk.match(/\d/g) ?? []).length > 6) return "number-heavy";
  if (/\b[A-Z]{4,}\b/.test(chunk)) return "all-caps heading";
  if (/--/.test(chunk)) return "double-dash typography";
  if (!/[.!?]$/.test(chunk)) return "does not end a sentence";
  if (/\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|etc|No)\.$/.test(chunk)) return "cut off after an abbreviation";
  if (splitSentences(chunk).some((x) => wc(x) > MAX_SENTENCE_WORDS)) return "contains a marathon sentence";
  return null;
}

/** Greedy windows of whole sentences, 45-95 words and at most 480 characters. */
export function extractPassages(text: string, take: number): string[] {
  const sents = splitSentences(text.replace(/\s+/g, " ").trim());
  const out: string[] = [];
  for (let i = 0; i < sents.length && out.length < take; i++) {
    let chunk = "";
    let j = i;
    while (j < sents.length) {
      const next = chunk ? `${chunk} ${sents[j]}` : sents[j];
      if (next.length > MAX_PASSAGE_CHARS) break;
      chunk = next;
      j++;
      if (wc(chunk) >= 60) break;
    }
    const words = wc(chunk);
    if (words >= MIN_PASSAGE_WORDS && words <= MAX_PASSAGE_WORDS && !rejectReason(chunk)) {
      out.push(chunk);
      i = j; // continue after this passage
    }
  }
  return out;
}

import { phrases, type PhraseCategory, type PhraseEntry } from "../phrases";

export type LintHit = {
  phrase: string;
  category: PhraseCategory;
  start: number;
  end: number;
  replacements: string[];
  notes: string;
};

export type LintResult = {
  hits: LintHit[];
  byCategory: Record<PhraseCategory, number>;
  score: number;
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPhraseRegex(phrase: string): RegExp {
  const escaped = escapeRegex(phrase);
  // word boundaries only when the phrase starts/ends with a word character
  const startsWithWord = /^\w/.test(phrase);
  const endsWithWord = /\w$/.test(phrase);
  const left = startsWithWord ? "\\b" : "";
  const right = endsWithWord ? "\\b" : "";
  return new RegExp(`${left}${escaped}${right}`, "gi");
}

export function lint(text: string): LintResult {
  const hits: LintHit[] = [];

  for (const entry of phrases) {
    const regex = buildPhraseRegex(entry.phrase);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      hits.push({
        phrase: match[0],
        category: entry.category,
        start: match.index,
        end: match.index + match[0].length,
        replacements: entry.replacements,
        notes: entry.notes,
      });
    }
  }

  hits.sort((a, b) => a.start - b.start);

  const byCategory: Record<PhraseCategory, number> = {
    "stock-phrase": 0,
    hedge: 0,
    transition: 0,
    intensifier: 0,
    corporate: 0,
    "ai-tell": 0,
  };

  for (const hit of hits) {
    byCategory[hit.category] += 1;
  }

  return {
    hits,
    byCategory,
    score: computeLintScore(hits, text),
  };
}

function computeLintScore(hits: LintHit[], text: string): number {
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  if (words === 0) return 100;

  // weighted penalty: ai-tell hurts most, intensifier least
  const weights: Record<PhraseCategory, number> = {
    "ai-tell": 6,
    "stock-phrase": 4,
    corporate: 3,
    hedge: 2,
    transition: 1,
    intensifier: 1,
  };

  const penalty = hits.reduce((sum, h) => sum + weights[h.category], 0);
  const per100 = (penalty / words) * 100;
  const score = Math.max(0, 100 - per100);

  return Math.round(score);
}

export function categoryLabel(cat: PhraseCategory): string {
  const labels: Record<PhraseCategory, string> = {
    "stock-phrase": "Stock phrase",
    hedge: "Hedge",
    transition: "Transition",
    intensifier: "Intensifier",
    corporate: "Corporate",
    "ai-tell": "AI tell",
  };
  return labels[cat];
}

export function findPhraseEntry(phrase: string): PhraseEntry | undefined {
  const lower = phrase.toLowerCase();
  return phrases.find((p) => p.phrase.toLowerCase() === lower);
}
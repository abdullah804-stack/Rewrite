import { computeMetrics, splitSentences, splitWords } from "./metrics";

export type AudienceTarget =
  | "general"
  | "professional"
  | "academic"
  | "marketing";

export type ReadabilityResult = {
  grade: number;
  label: string;
  audience: AudienceTarget;
  targetRange: { min: number; max: number };
  inRange: boolean;
  notes: string[];
  longSentences: number[];
  passiveHints: number;
  plainLanguageIssues: string[];
};

const AUDIENCE_RANGES: Record<AudienceTarget, { min: number; max: number }> = {
  general: { min: 6, max: 9 },
  professional: { min: 8, max: 12 },
  academic: { min: 12, max: 16 },
  marketing: { min: 5, max: 8 },
};

export function gradeLabel(grade: number): string {
  if (grade < 1) return "Below grade 1";
  if (grade < 5) return "Elementary";
  if (grade < 8) return "Middle school";
  if (grade < 12) return "High school";
  if (grade < 16) return "College";
  return "Graduate";
}

const PASSIVE_HINT_PATTERN =
  /\b(?:was|were|is|are|been|being|be)\s+\w+(?:ed|en)\b/gi;

const WORDY_PATTERNS: { pattern: RegExp; suggestion: string }[] = [
  { pattern: /\bin order to\b/gi, suggestion: "to" },
  { pattern: /\bdue to the fact that\b/gi, suggestion: "because" },
  { pattern: /\bat this point in time\b/gi, suggestion: "now" },
  { pattern: /\bin the event that\b/gi, suggestion: "if" },
  { pattern: /\bfor the purpose of\b/gi, suggestion: "to" },
  { pattern: /\bprior to\b/gi, suggestion: "before" },
  { pattern: /\bsubsequent to\b/gi, suggestion: "after" },
  { pattern: /\bwith the exception of\b/gi, suggestion: "except" },
  { pattern: /\bin the near future\b/gi, suggestion: "soon" },
  { pattern: /\ba large number of\b/gi, suggestion: "many" },
  { pattern: /\bthe majority of\b/gi, suggestion: "most" },
  { pattern: /\bis able to\b/gi, suggestion: "can" },
  { pattern: /\bhas the ability to\b/gi, suggestion: "can" },
  { pattern: /\bmake a decision\b/gi, suggestion: "decide" },
  { pattern: /\btake into consideration\b/gi, suggestion: "consider" },
];

function countPassiveHints(text: string): number {
  const matches = text.match(PASSIVE_HINT_PATTERN);
  return matches ? matches.length : 0;
}

function findPlainLanguageIssues(text: string): string[] {
  const issues: string[] = [];
  for (const { pattern, suggestion } of WORDY_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    const match = re.exec(text);
    if (match) {
      issues.push(`"${match[0]}" → "${suggestion}"`);
    }
  }
  return issues;
}

function findLongSentences(text: string, threshold = 25): number[] {
  const sentences = splitSentences(text);
  const indexes: number[] = [];
  sentences.forEach((s, i) => {
    const wordCount = splitWords(s).length;
    if (wordCount > threshold) indexes.push(i);
  });
  return indexes;
}

function clampGrade(grade: number): number {
  if (!Number.isFinite(grade) || grade <= 0) return 1;
  if (grade > 20) return 20;
  return Number(grade.toFixed(1));
}

export function analyzeReadability(
  text: string,
  audience: AudienceTarget = "general"
): ReadabilityResult {
  const metrics = computeMetrics(text);
  const grade = metrics.wordCount === 0 ? 0 : clampGrade(metrics.readingGrade);
  const targetRange = AUDIENCE_RANGES[audience];

  const inRange = grade >= targetRange.min && grade <= targetRange.max;

  const notes: string[] = [];

  if (grade > targetRange.max) {
    notes.push(
      `Grade ${grade.toFixed(1)} is above the target for ${audience} readers (max ${targetRange.max}).`
    );
  } else if (grade < targetRange.min && grade > 0) {
    notes.push(
      `Grade ${grade.toFixed(1)} is below the target for ${audience} readers (min ${targetRange.min}).`
    );
  }

  const longSentences = findLongSentences(text);
  if (longSentences.length > 0) {
    notes.push(
      `${longSentences.length} sentence${longSentences.length === 1 ? "" : "s"} over 25 words.`
    );
  }

  const passiveHints = countPassiveHints(text);
  if (passiveHints > 0) {
    notes.push(
      `${passiveHints} possible passive construction${passiveHints === 1 ? "" : "s"}.`
    );
  }

  const plainLanguageIssues = findPlainLanguageIssues(text);
  if (plainLanguageIssues.length > 0) {
    notes.push(`${plainLanguageIssues.length} wordy phrase${plainLanguageIssues.length === 1 ? "" : "s"}.`);
  }

  return {
    grade: Number(grade.toFixed(1)),
    label: gradeLabel(grade),
    audience,
    targetRange,
    inRange,
    notes,
    longSentences,
    passiveHints,
    plainLanguageIssues,
  };
}

export function audienceLabel(audience: AudienceTarget): string {
  const labels: Record<AudienceTarget, string> = {
    general: "General",
    professional: "Professional",
    academic: "Academic",
    marketing: "Marketing",
  };
  return labels[audience];
}
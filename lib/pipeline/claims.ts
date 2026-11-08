// Step 12: Renamed to Source & Claim Checks (Audit §9C)
// The old "Claim" terminology implied fact-checking. We now use "Source checks".
// Note: We DO NOT verify if the source exists or is true. We only check if
// a citation-like string (URL, year, "According to X") is nearby.

export type ClaimKind =
  | "percentage"
  | "currency"
  | "statistic"
  | "date"
  | "study-reference"
  | "expert-reference"
  | "quote";

export type SourceCheckFlag = {
  kind: ClaimKind;
  text: string;
  start: number;
  end: number;
  hasSource: boolean;
  status: "source_found" | "source_missing";
  reason: string;
};

export type SourceCheckResult = {
  flags: SourceCheckFlag[];
  unsourcedCount: number;
  sourcedCount: number;
};

const SOURCE_HINTS: RegExp[] = [
  /https?:\/\/[^\s)\]}"'<>]+/g,
  /\([A-Z][a-zA-Z]+(?:\s+et\s+al\.)?,\s*\d{4}\)/g,
  /\baccording to\b/gi,
  /\bper\s+\w+/gi,
  /\bsource[d]?:\s/gi,
  /\bcited in\b/gi,
  /\breported by\b/gi,
  /\bfrom\s+[A-Z][a-zA-Z]+/g,
];

const CHECK_PATTERNS: {
  kind: ClaimKind;
  regex: RegExp;
  reason: string;
}[] = [
  {
    kind: "percentage",
    regex: /\b\d+(?:\.\d+)?\s?%/g,
    reason: "Percentage detected — verify the source",
  },
  {
    kind: "currency",
    regex: /\$\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:million|billion|thousand|k|M|B))?/g,
    reason: "Currency figure detected — verify the source",
  },
  {
    kind: "study-reference",
    regex: /\b(?:studies|research|surveys?|data|reports?)\s+(?:show|shows|suggest|suggests|indicate|indicates|found|find|reveal|reveals)\b/gi,
    reason: "Study reference detected — no citation nearby",
  },
  {
    kind: "expert-reference",
    regex: /\b(?:experts?|scientists?|researchers?|analysts?|officials?)\s+(?:say|says|believe|believes|agree|agrees|warn|warns|claim|claims)\b/gi,
    reason: "Expert reference detected — no name nearby",
  },
  {
    kind: "date",
    regex: /\b(?:in|since|by|during|from)\s+(?:19|20)\d{2}\b/gi,
    reason: "Date detected — confirm it is accurate",
  },
  {
    kind: "statistic",
    regex: /\b\d{1,3}(?:,\d{3})+\b/g,
    reason: "Large figure detected — verify the source",
  },
];

function sentenceBounds(text: string, pos: number): { start: number; end: number } {
  const terminators = /[.!?]\s+/g;

  let sentenceStart = 0;
  let match: RegExpExecArray | null;
  while ((match = terminators.exec(text)) !== null) {
    if (match.index + match[0].length <= pos) {
      sentenceStart = match.index + match[0].length;
    } else {
      break;
    }
  }

  const after = text.slice(pos);
  const endMatch = after.match(/[.!?](?:\s|$)/);
  const sentenceEnd = endMatch
    ? pos + (endMatch.index ?? 0) + 1
    : text.length;

  return { start: sentenceStart, end: sentenceEnd };
}

function hasSourceInSentence(text: string, start: number, end: number): boolean {
  const bounds = sentenceBounds(text, start);
  const sentence = text.slice(bounds.start, bounds.end);

  void end;

  for (const pattern of SOURCE_HINTS) {
    const re = new RegExp(pattern.source, pattern.flags);
    if (re.test(sentence)) return true;
  }

  return false;
}

export function findSourceChecks(text: string): SourceCheckResult {
  const flags: SourceCheckFlag[] = [];

  for (const { kind, regex, reason } of CHECK_PATTERNS) {
    const re = new RegExp(regex.source, regex.flags);
    let match: RegExpExecArray | null;

    while ((match = re.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      const overlaps = flags.some((f) => start < f.end && end > f.start);
      if (overlaps) continue;

      const sourced = hasSourceInSentence(text, start, end);

      flags.push({
        kind,
        text: match[0],
        start,
        end,
        hasSource: sourced,
        status: sourced ? "source_found" : "source_missing",
        reason,
      });
    }
  }

  flags.sort((a, b) => a.start - b.start);

  const unsourcedCount = flags.filter((f) => !f.hasSource).length;
  const sourcedCount = flags.filter((f) => f.hasSource).length;

  return { flags, unsourcedCount, sourcedCount };
}

export function sourceCheckKindLabel(kind: ClaimKind): string {
  const labels: Record<ClaimKind, string> = {
    percentage: "Percentage",
    currency: "Currency",
    statistic: "Statistic",
    date: "Date",
    "study-reference": "Study reference",
    "expert-reference": "Expert reference",
    quote: "Quote",
  };
  return labels[kind];
}
export type ProtectedSpan = {
  token: string;
  original: string;
  kind:
    | "url"
    | "email"
    | "number"
    | "currency"
    | "percent"
    | "year"
    | "quote"
    | "citation"
    | "code"
    | "heading";
  start: number;
  end: number;
};

export type ProtectedText = {
  masked: string;
  spans: ProtectedSpan[];
};

// Step 10: Added `heading` and `code` protection (Audit §3A)
// Order matters: Fenced code blocks must be caught before inline code or URLs
// so they don't get split up by inner matches.
const PATTERNS: { kind: ProtectedSpan["kind"]; regex: RegExp }[] = [
  // 1. Fenced code blocks (multi-line)
  { kind: "code", regex: /```[\s\S]*?```/g },
  // 2. Markdown headings (e.g., # Heading, ## Subheading)
  { kind: "heading", regex: /^#{1,6}\s.+$/gm },
  // 3. Inline code (single backticks)
  { kind: "code", regex: /`[^`\n]+`/g },
  // 4. URLs
  { kind: "url", regex: /https?:\/\/[^\s)\]}"'<>]+/g },
  // 5. Emails
  { kind: "email", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  // 6. Currency
  { kind: "currency", regex: /\$\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:million|billion|thousand|k|M|B))?/g },
  // 7. Percent
  { kind: "percent", regex: /\d+(?:\.\d+)?\s?%/g },
  // 8. Years
  { kind: "year", regex: /\b(?:19|20)\d{2}\b/g },
  // 9. Multi-digit numbers (excludes single digits like "01")
  { kind: "number", regex: /\b\d{2,}[\d,]*(?:\.\d+)?\b/g },
  // 10. Quotes
  { kind: "quote", regex: /"[^"\n]{1,200}"/g },
  // 11. Citations
  { kind: "citation", regex: /\([A-Z][a-zA-Z]+(?:\s+et\s+al\.)?,\s*\d{4}\)/g },
];

export function protect(input: string): ProtectedText {
  type RawMatch = {
    kind: ProtectedSpan["kind"];
    value: string;
    start: number;
    end: number;
  };

  const matches: RawMatch[] = [];

  for (const { kind, regex } of PATTERNS) {
    const re = new RegExp(regex.source, regex.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null) {
      matches.push({
        kind,
        value: m[0],
        start: m.index,
        end: m.index + m[0].length,
      });
    }
  }

  matches.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.end - a.end;
  });

  const accepted: RawMatch[] = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      accepted.push(m);
      lastEnd = m.end;
    }
  }

  let masked = "";
  let cursor = 0;
  const spans: ProtectedSpan[] = [];

  accepted.forEach((m, i) => {
    masked += input.slice(cursor, m.start);
    const token = `⟦P${i + 1}⟧`;
    masked += token;
    spans.push({
      token,
      original: m.value,
      kind: m.kind,
      start: m.start,
      end: m.end,
    });
    cursor = m.end;
  });

  masked += input.slice(cursor);

  return { masked, spans };
}

export function restore(masked: string, spans: ProtectedSpan[]): string {
  let result = masked;
  for (const span of spans) {
    result = result.split(span.token).join(span.original);
  }
  return result;
}

export function verifySpans(
  rewritten: string,
  spans: ProtectedSpan[]
): { ok: boolean; missing: ProtectedSpan[] } {
  const missing: ProtectedSpan[] = [];
  for (const span of spans) {
    if (!rewritten.includes(span.token)) {
      missing.push(span);
    }
  }
  return { ok: missing.length === 0, missing };
}
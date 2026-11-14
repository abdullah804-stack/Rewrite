/** Shared helpers for the benchmark scripts: CSV, stats, and local shape metrics. */
import { splitSentences } from "../lib/pipeline/aiTells";

export const DETECTORS = ["stealthwriter", "zerogpt", "cleverhumanizer", "gptzero"] as const;

export const BASE_COLUMNS = [
  "kind", "id", "run", "words", "provider", "model", "ms",
  "tell_score", "burstiness", "short_ratio", "long_short_pairs",
  "copied_bigrams", "persona", "stock", "similar_runs", "issues_left",
] as const;

export const HEADER: string[] = [...BASE_COLUMNS, ...DETECTORS, "error"];

export type Kind = "output" | "ai_input" | "human";

export const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

/* ---------- CSV (quotes fields that contain commas, quotes or newlines) ---------- */

export function csvEscape(v: string): string {
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n") + "\n";
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else inQuotes = false;
      } else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x !== "")) rows.push(row);
  return rows;
}

/* ---------- stats ---------- */

export const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);

export function quantile(a: number[], q: number): number {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
export const median = (a: number[]) => quantile(a, 0.5);

export function pearson(x: number[], y: number[]): number {
  const mx = mean(x), my = mean(y);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < x.length; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  const d = Math.sqrt(dx * dy);
  return d ? num / d : NaN;
}

/* ---------- local shape metrics (same idea the analysis found in the outputs) ---------- */

/** share of sentences with 5 words or fewer, and count of (>=18 words) -> (<=5 words) pairs */
export function rhythmShape(text: string): { shortRatio: number; longShortPairs: number } {
  const lens = splitSentences(text).map(wordCount);
  if (!lens.length) return { shortRatio: 0, longShortPairs: 0 };
  const short = lens.filter((n) => n <= 5).length;
  let pairs = 0;
  for (let i = 1; i < lens.length; i++) if (lens[i - 1] >= 18 && lens[i] <= 5) pairs++;
  return { shortRatio: short / lens.length, longShortPairs: pairs };
}

export function fmt(n: number, digits = 0): string {
  return Number.isFinite(n) ? n.toFixed(digits) : "n/a";
}

import type { Metrics } from "./metrics";

export type MetricDelta = {
  label: string;
  before: number;
  after: number;
  delta: number;
  direction: "up" | "down" | "flat";
  goal: "higher" | "lower" | "target";
  improved: boolean;
  hint: string;
};

export type StyleReport = {
  deltas: MetricDelta[];
  summary: string;
  improvedCount: number;
  worsenedCount: number;
};

type Rule = {
  key: keyof Metrics;
  label: string;
  goal: "higher" | "lower";
  hint: string;
  unit?: "words" | "percent" | "raw";
  /** minimum absolute delta worth showing */
  threshold: number;
};

const RULES: Rule[] = [
  {
    key: "sentenceLenSd",
    label: "Sentence length variety",
    goal: "higher",
    hint: "Varied rhythm reads as human. Uniform rhythm reads as AI.",
    threshold: 0.5,
  },
  {
    key: "contractionRate",
    label: "Contractions",
    goal: "higher",
    hint: "Natural writing uses contractions. Formal AI prose avoids them.",
    unit: "percent",
    threshold: 0.005,
  },
  {
    key: "firstPersonRate",
    label: "First person",
    goal: "higher",
    hint: "A human presence makes writing feel grounded.",
    unit: "percent",
    threshold: 0.005,
  },
  {
    key: "emDashPer1k",
    label: "Em dashes per 1k words",
    goal: "lower",
    hint: "AI overuses em dashes. Fewer reads more human.",
    threshold: 0.5,
  },
  {
    key: "readingGrade",
    label: "Reading grade",
    goal: "lower",
    hint: "Simpler writing is usually stronger.",
    threshold: 0.3,
  },
];

function round(n: number, unit?: Rule["unit"]): number {
  if (unit === "percent") return Number((n * 100).toFixed(1));
  return Number(n.toFixed(1));
}

export function buildStyleReport(
  before: Metrics,
  after: Metrics
): StyleReport {
  const deltas: MetricDelta[] = [];

  for (const rule of RULES) {
    const b = before[rule.key] as number;
    const a = after[rule.key] as number;
    const delta = a - b;

    if (Math.abs(delta) < rule.threshold) continue;

    const direction: MetricDelta["direction"] =
      delta > 0 ? "up" : delta < 0 ? "down" : "flat";

    const improved =
      rule.goal === "higher"
        ? direction === "up"
        : direction === "down";

    deltas.push({
      label: rule.label,
      before: round(b, rule.unit),
      after: round(a, rule.unit),
      delta: round(Math.abs(delta), rule.unit),
      direction,
      goal: rule.goal,
      improved,
      hint: rule.hint,
    });
  }

  // Sort so improvements come first, then by magnitude
  deltas.sort((x, y) => {
    if (x.improved !== y.improved) return x.improved ? -1 : 1;
    return y.delta - x.delta;
  });

  const improvedCount = deltas.filter((d) => d.improved).length;
  const worsenedCount = deltas.filter((d) => !d.improved).length;

  const summary =
    deltas.length === 0
      ? "No measurable change."
      : improvedCount > worsenedCount
      ? "The rewrite moved the draft toward more natural language."
      : worsenedCount > improvedCount
      ? "The rewrite changed the draft but did not consistently improve it."
      : "The rewrite is roughly equal to the original on these measures.";

  return { deltas, summary, improvedCount, worsenedCount };
}
"use client";

import { lint, type LintResult } from "./pipeline/lint";
import { findSourceChecks, type SourceCheckResult } from "./pipeline/claims";
import { computeMetrics, type Metrics } from "./pipeline/metrics";
import { analyzeReadability, type ReadabilityResult, type AudienceTarget } from "./pipeline/readability";

export type AnalysisBundle = {
  metrics: Metrics;
  lint: LintResult;
  claims: SourceCheckResult; // Step 12: Renamed internally
  readability: ReadabilityResult;
};

export function analyzeText(
  text: string,
  audience: AudienceTarget = "general"
): AnalysisBundle {
  return {
    metrics: computeMetrics(text),
    lint: lint(text),
    claims: findSourceChecks(text),
    readability: analyzeReadability(text, audience),
  };
}
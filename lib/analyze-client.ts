"use client";

import { lint, type LintResult } from "./pipeline/lint";
import { findClaims, type ClaimResult } from "./pipeline/claims";
import { computeMetrics, type Metrics } from "./pipeline/metrics";
import { analyzeReadability, type ReadabilityResult, type AudienceTarget } from "./pipeline/readability";

export type AnalysisBundle = {
  metrics: Metrics;
  lint: LintResult;
  claims: ClaimResult;
  readability: ReadabilityResult;
};

export function analyzeText(
  text: string,
  audience: AudienceTarget = "general"
): AnalysisBundle {
  return {
    metrics: computeMetrics(text),
    lint: lint(text),
    claims: findClaims(text),
    readability: analyzeReadability(text, audience),
  };
}
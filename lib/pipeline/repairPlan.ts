/**
 * Decides what the AI-tell checks are allowed to influence.
 *
 * The tell score is a home-made proxy. Nobody has shown that it predicts what detectors say (the
 * benchmark in bench/ measures exactly that), and optimising a proxy hard makes the model satisfy the
 * checker instead of writing naturally: the old "make sentences very short and very long" repair message
 * produced a mechanical rhythm. So by default:
 *
 *   "fixable" (default)  candidate choice and repair passes act only on concrete defects (stock phrases,
 *                        em dashes, copied wording, summarizing closer, question opener) and on meaning
 *                        problems found by the reviewer. Sentence-shape statistics are reported, never chased.
 *   "all"                the previous behaviour: every tell, statistics included, drives selection and repair.
 *
 * Set TELL_REPAIR=all to get the old behaviour back, or compare the two with `pnpm bench --repair all`.
 */
import type { TellReport } from "./aiTells";

export type RepairMode = "fixable" | "all";

/** With mode "all", repair stops once the total score is at or below this and the reviewer found no issues. */
export const TARGET_SCORE = 2;

export function repairModeFromEnv(raw: string | undefined = process.env.TELL_REPAIR): RepairMode {
  return (raw ?? "").trim().toLowerCase() === "all" ? "all" : "fixable";
}

const meaning = (issues: string[]) => issues.map((i) => `Meaning/clarity: ${i}`);

/** The number candidates are ranked and repairs are accepted on. Lower is better. */
export function rankScore(report: TellReport, mode: RepairMode): number {
  return mode === "all" ? report.score : report.fixScore;
}

/** Everything a repair pass is asked to fix: tell problems for this mode, plus reviewer-found meaning issues. */
export function repairProblems(report: TellReport, issues: string[], mode: RepairMode): string[] {
  return [...(mode === "all" ? report.problems : report.fixable), ...meaning(issues)];
}

/** Whether another repair pass is worth running. */
export function needsRepair(report: TellReport, issues: string[], mode: RepairMode): boolean {
  const problems = repairProblems(report, issues, mode);
  if (problems.length === 0) return false;
  if (mode === "all" && report.score <= TARGET_SCORE && issues.length === 0) return false;
  return true;
}

/** Cost used to accept or reject a repaired candidate. Meaning issues count double, as before. */
export function repairCost(report: TellReport, issues: string[], mode: RepairMode): number {
  return rankScore(report, mode) + issues.length * 2;
}

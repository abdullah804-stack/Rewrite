"use client";

import type { Metrics } from "@/lib/pipeline/metrics";
import { buildStyleReport } from "@/lib/pipeline/report";

export function StyleReport({
  before,
  after,
}: {
  before: Metrics;
  after: Metrics;
}) {
  const report = buildStyleReport(before, after);

  if (report.deltas.length === 0) {
    return (
      <div className="text-xs text-neutral-400">
        No measurable change in style metrics.
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
        Style report
      </div>

      <p className="text-sm text-neutral-600 mb-4">{report.summary}</p>

      <div className="rounded-lg border border-neutral-200 divide-y divide-neutral-200">
        {report.deltas.map((d) => (
          <div
            key={d.label}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <div className="min-w-0">
              <div className="text-black truncate">{d.label}</div>
              <div className="text-xs text-neutral-400 mt-0.5">
                {d.before} → {d.after}
              </div>
            </div>
            <span
              className={`text-xs font-medium whitespace-nowrap px-2 py-0.5 rounded ${
                d.improved
                  ? "bg-neutral-100 text-black"
                  : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {d.direction === "up" ? "↑" : "↓"} {d.delta}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-400 mt-3">
        Metrics are heuristic. They show direction, not proof of quality.
      </p>
    </div>
  );
}
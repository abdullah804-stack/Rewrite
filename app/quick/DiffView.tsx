"use client";

import { useState, useMemo } from "react";
import {
  diffSentences,
  assembleAccepted,
  type DiffResult,
} from "@/lib/pipeline/diff";

export function DiffView({
  original,
  rewritten,
  onCopyAccepted,
}: {
  original: string;
  rewritten: string;
  onCopyAccepted: (text: string) => void;
}) {
  const initial: DiffResult = useMemo(
    () => diffSentences(original, rewritten),
    [original, rewritten]
  );

  const [segments, setSegments] = useState(initial.segments);

  function toggle(index: number) {
    setSegments((prev) =>
      prev.map((s, i) => (i === index ? { ...s, accepted: !s.accepted } : s))
    );
  }

  function acceptAll() {
    setSegments((prev) => prev.map((s) => ({ ...s, accepted: true })));
  }

  function rejectAll() {
    setSegments((prev) => prev.map((s) => ({ ...s, accepted: false })));
  }

  const diff: DiffResult = {
    segments,
    changedCount: segments.filter((s) => s.changed).length,
    unchangedCount: segments.filter((s) => !s.changed).length,
  };

  function handleCopy() {
    onCopyAccepted(assembleAccepted(diff));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={handleCopy}
          className="h-9 px-4 rounded-lg bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
        >
          Copy accepted
        </button>
        <button
          type="button"
          onClick={acceptAll}
          className="h-9 px-3 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Accept all
        </button>
        <button
          type="button"
          onClick={rejectAll}
          className="h-9 px-3 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Reject all
        </button>
        <span className="text-xs text-neutral-400 ml-auto">
          {diff.changedCount} changed · {diff.unchangedCount} kept
        </span>
      </div>

      <div className="space-y-3">
        {segments.map((seg, i) => {
          if (!seg.changed) {
            return (
              <div
                key={i}
                className="p-3 rounded-lg border border-neutral-200 bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {seg.original}
                  </p>
                  <span className="text-xs text-neutral-400 whitespace-nowrap">
                    kept
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={i}
              className={`p-3 rounded-lg border ${
                seg.accepted
                  ? "border-neutral-200 bg-white"
                  : "border-neutral-200 bg-neutral-50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-xs text-neutral-400 uppercase tracking-wide">
                  {seg.original ? "Change" : "Added"}
                </span>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className={`text-xs font-medium transition-colors ${
                    seg.accepted
                      ? "text-neutral-500 hover:text-black"
                      : "text-neutral-400 hover:text-black"
                  }`}
                >
                  {seg.accepted ? "Reject" : "Accept"}
                </button>
              </div>

              {seg.original && (
                <p className="text-sm text-neutral-400 line-through leading-relaxed mb-1">
                  {seg.original}
                </p>
              )}

              <p
                className={`text-sm leading-relaxed ${
                  seg.accepted ? "text-black" : "text-neutral-500"
                }`}
              >
                {seg.rewritten}
              </p>

              {seg.reason && (
                <p className="text-xs text-neutral-400 mt-2">{seg.reason}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
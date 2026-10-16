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
  context,
  profileId,
  onCopyAccepted,
}: {
  original: string;
  rewritten: string;
  context?: string;
  profileId?: string | null;
  onCopyAccepted: (text: string) => void;
}) {
  const initial: DiffResult = useMemo(
    () => diffSentences(original, rewritten),
    [original, rewritten]
  );

  const [segments, setSegments] = useState(initial.segments);
  const [regenIndex, setRegenIndex] = useState<number | null>(null);
  const [regenError, setRegenError] = useState<string | null>(null);

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

  async function regenerate(index: number) {
    const seg = segments[index];
    setRegenIndex(index);
    setRegenError(null);

    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regen",
          text: seg.original || seg.rewritten,
          context: context ?? original,
          profileId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setRegenError(data.error ?? "Regenerate failed.");
        return;
      }

      setSegments((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, rewritten: data.rewritten, accepted: true, changed: true, reason: "Regenerated" }
            : s
        )
      );
    } catch (err) {
      setRegenError((err as Error).message);
    } finally {
      setRegenIndex(null);
    }
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

      {regenError && (
        <div className="text-xs text-red-600 mb-3">{regenError}</div>
      )}

      <div className="space-y-3">
        {segments.map((seg, i) => {
          const isRegenerating = regenIndex === i;

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
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs text-neutral-400 uppercase tracking-wide">
                  {seg.original ? "Change" : "Added"}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => regenerate(i)}
                    disabled={isRegenerating}
                    className="text-xs font-medium text-neutral-500 hover:text-black disabled:text-neutral-300 transition-colors"
                  >
                    {isRegenerating ? "…" : "Regenerate"}
                  </button>
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
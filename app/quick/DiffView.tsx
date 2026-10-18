"use client";

import { useState, useMemo } from "react";
import {
  diffSentences,
  assembleAccepted,
  type DiffResult,
} from "@/lib/pipeline/diff";
import { ExportMenu } from "./ExportMenu";

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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [speaking, setSpeaking] = useState(false);

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

  function handleDragStart(e: React.DragEvent, index: number) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSegments = [...segments];
    const draggedItem = newSegments[draggedIndex];
    newSegments.splice(draggedIndex, 1);
    newSegments.splice(index, 0, draggedItem);

    setSegments(newSegments);
    setDraggedIndex(index);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  const diff: DiffResult = {
    segments,
    changedCount: segments.filter((s) => s.changed).length,
    unchangedCount: segments.filter((s) => !s.changed).length,
  };

  function handleCopy() {
    onCopyAccepted(assembleAccepted(diff));
  }

  // Text-to-Speech logic
  function handleSpeak() {
    if (!("speechSynthesis" in window)) {
      alert("Your browser doesn't support text-to-speech.");
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const textToRead = assembleAccepted(diff);
    if (!textToRead.trim()) return;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    // Slightly slower than default reads more naturally for editing
    utterance.rate = 0.95;
    
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <ExportMenu
          text={assembleAccepted(diff)}
          title="Rewrite"
          onCopied={(label) => onCopyAccepted(label)}
        />
        
        <button
          type="button"
          onClick={handleSpeak}
          className={`h-9 px-3 rounded-lg border text-xs font-medium transition-colors flex items-center gap-2 ${
            speaking
              ? "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
              : "border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          }`}
        >
          {speaking ? (
            <>
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              Stop
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              Read aloud
            </>
          )}
        </button>

        <div className="h-6 border-l border-neutral-200 dark:border-neutral-800 mx-1"></div>

        <button
          type="button"
          onClick={acceptAll}
          className="h-9 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Accept all
        </button>
        <button
          type="button"
          onClick={rejectAll}
          className="h-9 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Reject all
        </button>
        <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-auto">
          {diff.changedCount} changed · {diff.unchangedCount} kept
        </span>
      </div>

      {regenError && (
        <div className="text-xs text-red-600 dark:text-red-400 mb-3">{regenError}</div>
      )}

      <div className="space-y-3">
        {segments.map((seg, i) => {
          const isRegenerating = regenIndex === i;
          const isDragging = draggedIndex === i;

          return (
            <div
              key={i}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className={`group relative p-3 pl-10 rounded-lg border transition-all ${
                isDragging ? "opacity-50 border-black dark:border-white" : ""
              } ${
                seg.accepted
                  ? "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                  : "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 opacity-60"
              }`}
            >
              <div 
                className="absolute left-3 top-3 bottom-3 w-4 flex items-center justify-center cursor-grab active:cursor-grabbing text-neutral-300 dark:text-neutral-600 hover:text-black dark:hover:text-white"
                title="Drag to reorder"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M8 6h2v2H8V6zm0 5h2v2H8v-2zm0 5h2v2H8v-2zm6-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2z"/>
                </svg>
              </div>

              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                  {seg.original ? (seg.changed ? "Change" : "Kept") : "Added"}
                </span>
                <div className="flex items-center gap-3">
                  {seg.changed && (
                    <button
                      type="button"
                      onClick={() => regenerate(i)}
                      disabled={isRegenerating}
                      className="text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white disabled:text-neutral-300 dark:disabled:text-neutral-600 transition-colors"
                    >
                      {isRegenerating ? "…" : "Regenerate"}
                    </button>
                  )}
                  {seg.changed && (
                    <button
                      type="button"
                      onClick={() => toggle(i)}
                      className={`text-xs font-medium transition-colors ${
                        seg.accepted
                          ? "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                          : "text-neutral-400 dark:text-neutral-500 hover:text-black dark:hover:text-white"
                      }`}
                    >
                      {seg.accepted ? "Reject" : "Accept"}
                    </button>
                  )}
                </div>
              </div>

              {seg.original && seg.changed && (
                <p className="text-sm text-neutral-400 dark:text-neutral-500 line-through leading-relaxed mb-1">
                  {seg.original}
                </p>
              )}

              {(!seg.original || !seg.changed) && seg.original && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {seg.original}
                </p>
              )}

              {seg.changed && (
                <p
                  className={`text-sm leading-relaxed ${
                    seg.accepted ? "text-black dark:text-white" : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {seg.rewritten}
                </p>
              )}

              {seg.reason && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">{seg.reason}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
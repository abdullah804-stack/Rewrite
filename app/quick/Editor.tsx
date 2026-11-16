"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { applyAllFixes } from "@/lib/pipeline/fixes";
import type { PresetId } from "@/config/presets";
import { ImportMenu } from "./ImportMenu";
import { HeatmapEditor } from "./HeatmapEditor";
import { ReviewNotice, type RewriteReviewNotice } from "./ReviewNotice";

type SelectionInfo = {
  start: number;
  end: number;
  text: string;
};

export function Editor({
  value,
  onChange,
  profileId,
  projectId,
  seoSafe,
  intensity,
  preset,
  formality,
  directness,
  onError,
  onRewrite,
}: {
  value: string;
  onChange: (next: string) => void;
  profileId: string | null;
  projectId: string | null;
  seoSafe: boolean;
  intensity: "light" | "balanced" | "strong";
  preset: PresetId;
  formality: number;
  directness: number;
  onError: (message: string | null) => void;
  onRewrite?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [review, setReview] = useState<RewriteReviewNotice | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onRewrite?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onRewrite]);

  const captureSelection = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return;

    const start = element.selectionStart;
    const end = element.selectionEnd;
    if (start === end) {
      setSelection(null);
      return;
    }

    const selectedText = value.slice(start, end);
    if (selectedText.trim().length < 3) {
      setSelection(null);
      return;
    }

    setSelection({ start, end, text: selectedText });
  }, [value]);

  async function handleRewriteSelection() {
    if (!selection) return;

    setLoading(true);
    setReview(null);
    onError(null);
    try {
      const context = value.slice(0, selection.start) + value.slice(selection.end);
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "selection",
          text: selection.text,
          context,
          profileId,
          projectId,
          seoSafe,
          intensity,
          preset,
          toneFormality: formality,
          toneDirectness: directness,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        onError(data.error ?? "Selection rewrite failed.");
        return;
      }

      onChange(value.slice(0, selection.start) + data.rewritten + value.slice(selection.end));
      setReview(data.review ?? { status: "unavailable", issues: [] });
      requestAnimationFrame(() => {
        const element = textareaRef.current;
        if (!element) return;
        const newEnd = selection.start + data.rewritten.length;
        element.setSelectionRange(newEnd, newEnd);
        setSelection(null);
      });
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleFixAll() {
    const { result, appliedCount } = applyAllFixes(value);
    if (appliedCount > 0) onChange(result);
  }

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide hidden sm:block mr-1">
            Your draft <span className="text-neutral-300 ml-1 font-normal normal-case">(Cmd+Enter to rewrite)</span>
          </label>
          <button
            type="button"
            onClick={handleFixAll}
            className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-medium transition-colors bg-neutral-100 text-neutral-500 hover:text-black"
            title="Remove obvious AI-isms instantly without using AI"
          >
            Fix AI-isms
          </button>
          <button
            type="button"
            onClick={() => setHeatmapOn(!heatmapOn)}
            className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-medium transition-colors ${
              heatmapOn ? "bg-black text-white" : "bg-neutral-100 text-neutral-500 hover:text-black"
            }`}
          >
            Heatmap
          </button>
        </div>
        <div className="flex items-center gap-3">
          <ImportMenu onImported={(imported) => onChange(imported)} onError={onError} />
          <span className={`text-xs hidden sm:inline ${wordCount > 5000 ? "text-red-500 font-medium" : "text-neutral-400"}`}>
            {wordCount} / 5,000 words
          </span>
        </div>
      </div>

      <div className="relative flex-1 rounded-lg border border-neutral-200 bg-white overflow-hidden focus-within:border-neutral-400 transition-colors">
        {heatmapOn ? (
          <HeatmapEditor text={value} onChange={onChange} placeholder="Paste a draft from ChatGPT, Claude, or your own writing..." />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onMouseUp={captureSelection}
            onKeyUp={captureSelection}
            onSelect={captureSelection}
            placeholder="Paste a draft from ChatGPT, Claude, or your own writing..."
            className="w-full h-full p-4 text-sm text-black placeholder:text-neutral-400 focus:outline-none resize-none bg-transparent"
          />
        )}
        {selection && !loading && !heatmapOn && (
          <div className="absolute bottom-3 right-3">
            <button
              type="button"
              onClick={handleRewriteSelection}
              className="h-9 px-3 rounded-lg bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors shadow-sm"
            >
              Rewrite selection
            </button>
          </div>
        )}
        {loading && <div className="absolute bottom-3 right-3 text-xs text-neutral-400">Rewriting selection…</div>}
      </div>

      {selection && (
        <p className="text-xs text-neutral-400 mt-2 shrink-0">
          {selection.text.trim().split(/\s+/).length} words selected
        </p>
      )}
      <ReviewNotice review={review} />
    </div>
  );
}

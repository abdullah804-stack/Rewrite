"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ImportMenu } from "./ImportMenu";

type SelectionInfo = {
  start: number;
  end: number;
  text: string;
};

export function Editor({
  value,
  onChange,
  profileId,
  onError,
  onRewrite,
}: {
  value: string;
  onChange: (next: string) => void;
  profileId: string | null;
  onError: (message: string | null) => void;
  onRewrite?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (onRewrite) onRewrite();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onRewrite]);

  const captureSelection = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;

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
    onError(null);

    try {
      const context =
        value.slice(0, selection.start) + value.slice(selection.end);

      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "selection",
          text: selection.text,
          context,
          profileId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        onError(data.error ?? "Selection rewrite failed.");
        return;
      }

      const next =
        value.slice(0, selection.start) +
        data.rewritten +
        value.slice(selection.end);

      onChange(next);

      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        const newEnd = selection.start + data.rewritten.length;
        el.setSelectionRange(newEnd, newEnd);
        setSelection(null);
      });
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide hidden sm:block">
          Your draft <span className="text-neutral-300 dark:text-neutral-600 ml-1 font-normal normal-case">(Cmd+Enter to rewrite)</span>
        </label>
        <div className="flex items-center gap-3">
          <ImportMenu
            onImported={(imported) => onChange(imported)}
            onError={onError}
          />
          <span className="text-xs text-neutral-400 dark:text-neutral-500 hidden sm:inline">
            {wordCount} / 300 words without sign-in
          </span>
        </div>
      </div>

      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onMouseUp={captureSelection}
          onKeyUp={captureSelection}
          onSelect={captureSelection}
          placeholder="Paste a draft from ChatGPT, Claude, or your own writing..."
          className="w-full h-full p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 resize-none"
        />

        {selection && !loading && (
          <div className="absolute bottom-3 right-3">
            <button
              type="button"
              onClick={handleRewriteSelection}
              className="h-9 px-3 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-sm"
            >
              Rewrite selection
            </button>
          </div>
        )}

        {loading && (
          <div className="absolute bottom-3 right-3 text-xs text-neutral-400 dark:text-neutral-500">
            Rewriting selection…
          </div>
        )}
      </div>

      {selection && (
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 shrink-0">
          {selection.text.trim().split(/\s+/).length} words selected
        </p>
      )}
    </div>
  );
}
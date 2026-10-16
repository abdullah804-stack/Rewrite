"use client";

import { useRef, useState, useCallback } from "react";

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
}: {
  value: string;
  onChange: (next: string) => void;
  profileId: string | null;
  onError: (message: string | null) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [loading, setLoading] = useState(false);

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

      // clear selection highlight in the textarea
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
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
          Your draft
        </label>
        <span className="text-xs text-neutral-400">
          {wordCount} / 300 words without sign-in
        </span>
      </div>

      <div className="relative mt-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onMouseUp={captureSelection}
          onKeyUp={captureSelection}
          onSelect={captureSelection}
          placeholder="Paste a draft from ChatGPT, Claude, or your own writing..."
          className="w-full h-64 sm:h-80 lg:h-[500px] p-4 rounded-lg border border-neutral-200 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 resize-none"
        />

        {selection && !loading && (
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

        {loading && (
          <div className="absolute bottom-3 right-3 text-xs text-neutral-400">
            Rewriting selection…
          </div>
        )}
      </div>

      {selection && (
        <p className="text-xs text-neutral-400 mt-2">
          {selection.text.trim().split(/\s+/).length} words selected
        </p>
      )}
    </div>
  );
}
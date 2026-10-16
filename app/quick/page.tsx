"use client";

import { useState } from "react";
import Link from "next/link";

type Intensity = "light" | "balanced" | "strong";

type RewriteResponse = {
  ok: boolean;
  original: string;
  rewritten: string;
  provider: string;
  model: string;
  before: { wordCount: number; readingGrade: number; sentenceLenMean: number };
  after: { wordCount: number; readingGrade: number; sentenceLenMean: number };
  spansProtected: number;
  error?: string;
};

export default function QuickPage() {
  const [text, setText] = useState("");
  const [intensity, setIntensity] = useState<Intensity>("balanced");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RewriteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  async function handleRewrite() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, intensity }),
      });

      const data = (await res.json()) as RewriteResponse;

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Rewrite failed.");
        return;
      }

      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.rewritten);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setText("");
    setResult(null);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-black">
            Rewrite
          </Link>
          <Link
            href="/tools"
            className="text-sm text-neutral-500 hover:text-black transition-colors"
          >
            Free tools
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-semibold text-black">
          Quick rewrite
        </h1>
        <p className="text-sm text-neutral-500 mt-2 max-w-xl">
          Paste a draft. Get it back natural. Every number, URL, and quote is
          protected before the AI sees it.
        </p>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
            {(["light", "balanced", "strong"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setIntensity(level)}
                className={`h-8 px-3 rounded-md text-xs font-medium capitalize transition-colors ${
                  intensity === level
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-500 hover:text-black"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRewrite}
            disabled={loading || !text.trim()}
            className="h-10 px-5 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Rewriting..." : "Rewrite"}
          </button>

          {(text || result) && (
            <button
              type="button"
              onClick={handleReset}
              className="h-10 px-4 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Editor / Result */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
          {/* Input */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Your draft
              </label>
              <span className="text-xs text-neutral-400">
                {wordCount} / 300 words without sign-in
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste a draft from ChatGPT, Claude, or your own writing..."
              className="mt-2 w-full h-64 sm:h-80 lg:h-[500px] p-4 rounded-lg border border-neutral-200 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 resize-none"
            />
          </div>

          {/* Output */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Rewritten
              </label>
              {result && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs text-neutral-500 hover:text-black transition-colors"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>

            <div className="mt-2 w-full h-64 sm:h-80 lg:h-[500px] p-4 rounded-lg border border-neutral-200 bg-neutral-50 overflow-auto">
              {loading && (
                <div className="text-sm text-neutral-400">
                  Rewriting in your voice...
                </div>
              )}

              {!loading && !result && !error && (
                <div className="text-sm text-neutral-400">
                  Your rewrite will appear here.
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}

              {result && (
                <div className="text-sm text-black whitespace-pre-wrap leading-relaxed">
                  {result.rewritten}
                </div>
              )}
            </div>

            {result && (
              <div className="mt-3 text-xs text-neutral-400">
                Protected {result.spansProtected} facts · via {result.provider}
              </div>
            )}
          </div>
        </div>

        {!result && !loading && (
          <p className="text-xs text-neutral-400 mt-6">
            No account needed for short drafts. Sign in to rewrite up to 1,500
            words per run.
          </p>
        )}
      </div>
    </main>
  );
}
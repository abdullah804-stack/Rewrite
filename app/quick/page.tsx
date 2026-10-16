"use client";

import { useState } from "react";
import Link from "next/link";
import { ProfilePicker } from "./ProfilePicker";
import { DiffView } from "./DiffView";
import { StyleReport } from "./StyleReport";
import type { Metrics } from "@/lib/pipeline/metrics";

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
  profileUsed: { name: string } | null;
  error?: string;
};

export default function QuickPage() {
  const [text, setText] = useState("");
  const [intensity, setIntensity] = useState<Intensity>("balanced");
  const [profileId, setProfileId] = useState<string | null>(null);
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
        body: JSON.stringify({ text, intensity, profileId }),
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

  async function handleCopyText(value: string) {
    await navigator.clipboard.writeText(value);
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
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/profiles"
              className="text-sm text-neutral-500 hover:text-black transition-colors"
            >
              Voices
            </Link>
            <Link
              href="/tools"
              className="text-sm text-neutral-500 hover:text-black transition-colors hidden sm:inline"
            >
              Free tools
            </Link>
          </div>
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

        {!result && (
          <>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-6">
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

              <ProfilePicker value={profileId} onChange={setProfileId} />

              <button
                type="button"
                onClick={handleRewrite}
                disabled={loading || !text.trim()}
                className="h-10 px-5 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Rewriting..." : "Rewrite"}
              </button>

              {text && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-10 px-4 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="mt-6">
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

            {loading && (
              <p className="mt-4 text-sm text-neutral-400">
                Rewriting{profileId ? " in your voice" : ""}...
              </p>
            )}

            {error && (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            )}

            {!loading && !error && (
              <p className="text-xs text-neutral-400 mt-6">
                No account needed for short drafts. Sign in to rewrite up to
                1,500 words per run.
              </p>
            )}
          </>
        )}

        {result && (
          <>
            <div className="flex flex-wrap items-center gap-2 mt-6">
              <button
                type="button"
                onClick={handleReset}
                className="h-10 px-4 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                New rewrite
              </button>
              <span className="text-xs text-neutral-400 ml-auto">
                {copied ? "Copied" : ""}
              </span>
            </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mt-6">
              <div>
                <DiffView
                  original={result.original}
                  rewritten={result.rewritten}
                  onCopyAccepted={handleCopyText}
                />
              </div>
              <div>
                <StyleReport
                  before={result.before as unknown as Metrics}
                  after={result.after as unknown as Metrics}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-neutral-400">
              <span>Protected {result.spansProtected} facts</span>
              <span>via {result.provider}</span>
              {result.profileUsed && <span>voice: {result.profileUsed.name}</span>}
            </div>

            {!result.profileUsed && (
              <Link
                href="/profiles"
                className="inline-block mt-3 text-xs text-neutral-500 hover:text-black transition-colors"
              >
                Make it sound like you →
              </Link>
            )}
          </>
        )}
      </div>
    </main>
  );
}
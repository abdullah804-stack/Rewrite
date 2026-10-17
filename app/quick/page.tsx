"use client";

import { useState } from "react";
import Link from "next/link";
import { ProfilePicker } from "./ProfilePicker";
import { DiffView } from "./DiffView";
import { StyleReport } from "./StyleReport";
import { Editor } from "./Editor";
import type { Metrics } from "@/lib/pipeline/metrics";
import { PRESETS, type PresetId } from "@/config/presets";

type Intensity = "light" | "balanced" | "strong";

type RewriteResponse = {
  ok: boolean;
  original: string;
  rewritten: string;
  provider: string;
  model: string;
  before: Metrics;
  after: Metrics;
  spansProtected: number;
  profileUsed: { name: string } | null;
  error?: string;
};

export default function QuickPage() {
  const [text, setText] = useState("");
  const [intensity, setIntensity] = useState<Intensity>("balanced");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [preset, setPreset] = useState<PresetId>("custom");
  const [seoSafe, setSeoSafe] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RewriteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capacityReached, setCapacityReached] = useState(false);
  const [copied, setCopied] = useState("");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [documentId, setDocumentId] = useState<string | null>(null);

  async function handleRewrite() {
    setLoading(true);
    setError(null);
    setCapacityReached(false);
    setResult(null);

    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, intensity, profileId, preset, seoSafe }),
      });

      const data = (await res.json()) as RewriteResponse;

      if (res.status === 503) {
        setCapacityReached(true);
        return;
      }

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Rewrite failed.");
        return;
      }

      setResult(data);

      // Save the rewrite to the database if signed in
      if (typeof window !== "undefined") {
        fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            original: data.original,
            rewritten: data.rewritten,
            provider: data.provider,
            mode: "standard",
            profileId: profileId ?? undefined,
            styleReport: data.after,
            preset: preset,
          }),
        })
          .then((res) => res.json())
          .then((saved) => {
            if (saved?.document?.id) {
              setDocumentId(saved.document.id);
            }
            setHistoryRefreshKey((k) => k + 1);
          })
          .catch(() => {
            // history save is best-effort; never block the user
          });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyText(label: string) {
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  }

  function handleReset() {
    setText("");
    setResult(null);
    setError(null);
    setCapacityReached(false);
    setDocumentId(null);
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
          Paste a draft. Get it back natural. Highlight any sentence to
          rewrite just that part.
        </p>

        {!result && !capacityReached && (
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

              <div className="h-8 border-l border-neutral-200 mx-1 hidden sm:block"></div>

              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value as PresetId)}
                className="h-8 px-2 pr-8 rounded-md border border-neutral-200 text-xs text-black bg-white focus:outline-none focus:border-neutral-400"
              >
                {Object.entries(PRESETS).map(([id, p]) => (
                  <option key={id} value={id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <ProfilePicker value={profileId} onChange={setProfileId} />

              <label className="flex items-center gap-2 ml-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={seoSafe}
                  onChange={(e) => setSeoSafe(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black"
                />
                <span className="text-xs font-medium text-neutral-700">SEO-safe</span>
              </label>

              <button
                type="button"
                onClick={handleRewrite}
                disabled={loading || !text.trim()}
                className="h-10 px-5 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors ml-auto"
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
              <Editor
                value={text}
                onChange={setText}
                profileId={profileId}
                onError={setError}
              />
            </div>

            {loading && (
              <p className="mt-4 text-sm text-neutral-400">
                Rewriting{profileId ? " in your voice" : ""}...
              </p>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            {!loading && !error && (
              <p className="text-xs text-neutral-400 mt-6">
                No account needed for short drafts. Sign in to rewrite up to
                1,500 words per run.
              </p>
            )}
          </>
        )}

        {/* Capacity Reached State */}
        {capacityReached && (
          <div className="mt-8 p-6 sm:p-8 rounded-lg border border-neutral-200 bg-neutral-50">
            <h2 className="text-lg font-semibold text-black">
              Daily capacity reached
            </h2>
            <p className="text-sm text-neutral-600 mt-2 max-w-lg leading-relaxed">
              All free AI providers are currently at capacity. This usually clears up within a few minutes.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setCapacityReached(false);
                  handleRewrite();
                }}
                className="h-10 px-5 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                Try again
              </button>
              <Link
                href="/tools"
                className="h-10 px-5 rounded-lg border border-neutral-200 bg-white text-black text-sm font-medium leading-[38px] hover:bg-neutral-50 transition-colors"
              >
                Use the free tools instead
              </Link>
            </div>
          </div>
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
                {copied}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mt-6">
              <div>
                <DiffView
                  original={result.original}
                  rewritten={result.rewritten}
                  context={result.original}
                  profileId={profileId}
                  onCopyAccepted={handleCopyText}
                />
              </div>
              <div>
                <StyleReport before={result.before} after={result.after} />
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
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ProfilePicker } from "./ProfilePicker";
import { DiffView } from "./DiffView";
import { StyleReport } from "./StyleReport";
import { Editor } from "./Editor";
import { ProjectPicker } from "./ProjectPicker";
import { analyzeText } from "@/lib/analyze-client";
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
  const [projectId, setProjectId] = useState<string | null>(null);
  const [preset, setPreset] = useState<PresetId>("custom");
  const [seoSafe, setSeoSafe] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RewriteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capacityReached, setCapacityReached] = useState(false);
  const [copied, setCopied] = useState("");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const analysis = useMemo(() => {
    if (!text.trim()) return null;
    return analyzeText(text, "general");
  }, [text]);

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
            projectId: projectId ?? undefined,
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
          .catch(() => {});
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
    <main className="h-screen flex flex-col bg-white overflow-hidden">
      <header className="border-b border-neutral-200 shrink-0">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-black">
              Rewrite
            </Link>
            <span className="text-neutral-300">/</span>
            <Link href="/workspace" className="text-sm text-neutral-500 hover:text-black transition-colors">
              Workspace
            </Link>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/profiles"
              className="text-sm text-neutral-500 hover:text-black transition-colors hidden sm:inline"
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

      <div className="border-b border-neutral-200 bg-neutral-50 shrink-0 px-4 sm:px-6 py-2 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-neutral-200/50 rounded-lg p-1">
          {(["light", "balanced", "strong"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setIntensity(level)}
              className={`h-7 px-3 rounded-md text-xs font-medium capitalize transition-colors ${
                intensity === level
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-500 hover:text-black"
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="h-6 border-l border-neutral-300 mx-1"></div>

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
        <ProjectPicker value={projectId} onChange={setProjectId} />

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={seoSafe}
            onChange={(e) => setSeoSafe(e.target.checked)}
            className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black"
          />
          <span className="text-xs font-medium text-neutral-700">SEO-safe</span>
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleRewrite}
            disabled={loading || !text.trim()}
            className="h-8 px-4 rounded-lg bg-black text-white text-xs font-medium hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Rewriting..." : "Rewrite"}
          </button>
          {(text || result) && (
            <button
              type="button"
              onClick={handleReset}
              className="h-8 px-3 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-white transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 min-w-[300px] border-r border-neutral-200 flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-neutral-200 flex justify-between items-center shrink-0 bg-white">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Your draft
            </span>
            <span className="text-xs text-neutral-400">
              {wordCount} words
            </span>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <Editor
              value={text}
              onChange={setText}
              profileId={profileId}
              onError={setError}
            />
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </div>
        </div>

        <div className="flex-1 min-w-[300px] border-r border-neutral-200 flex flex-col overflow-hidden bg-neutral-50">
          <div className="px-4 py-2 border-b border-neutral-200 flex justify-between items-center shrink-0 bg-neutral-50">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Rewritten
            </span>
            {result && (
              <span className="text-xs text-neutral-400">
                via {result.provider}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {capacityReached && (
              <div className="p-4 rounded-lg border border-neutral-200 bg-white text-sm">
                <div className="font-medium text-black mb-1">Capacity reached</div>
                <div className="text-neutral-500 mb-3">All free AI providers are busy. Try again in a minute.</div>
                <button onClick={() => { setCapacityReached(false); handleRewrite(); }} className="text-black underline">Try again</button>
              </div>
            )}

            {!result && !capacityReached && !loading && (
              <div className="h-full flex items-center justify-center text-sm text-neutral-400">
                {text ? "Click Rewrite to see the magic." : "Paste some text to begin."}
              </div>
            )}

            {loading && (
              <div className="h-full flex items-center justify-center text-sm text-neutral-400">
                Rewriting{profileId ? " in your voice" : ""}...
              </div>
            )}

            {result && (
              <DiffView
                original={result.original}
                rewritten={result.rewritten}
                context={result.original}
                profileId={profileId}
                onCopyAccepted={handleCopyText}
              />
            )}
          </div>
        </div>

        <div className="w-80 shrink-0 flex flex-col overflow-hidden bg-white hidden xl:flex">
          <div className="px-4 py-2 border-b border-neutral-200 shrink-0">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Analysis
            </span>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-6">
            {!analysis && (
              <div className="text-sm text-neutral-400">
                Start typing to see live analysis.
              </div>
            )}

            {analysis && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-black">AI-isms</span>
                    <span className="text-sm text-black">{analysis.lint.score}/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full"
                      style={{ width: `${analysis.lint.score}%` }}
                    />
                  </div>
                  {analysis.lint.hits.length > 0 && (
                    <div className="text-xs text-neutral-500 mt-2">
                      Found {analysis.lint.hits.length} phrases to fix.
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-black">Claims</span>
                    <span className="text-sm text-black">{analysis.claims.unsourcedCount} need source</span>
                  </div>
                  {analysis.claims.flags.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {analysis.claims.flags.slice(0, 3).map((c, i) => (
                        <div key={i} className="text-xs text-neutral-500 bg-neutral-50 p-2 rounded border border-neutral-100">
                          &quot;{c.text}&quot;
                        </div>
                      ))}
                      {analysis.claims.flags.length > 3 && (
                        <div className="text-xs text-neutral-400">+ more...</div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-black">Readability</span>
                    <span className="text-sm text-black">Grade {analysis.readability.grade}</span>
                  </div>
                  <div className="text-xs text-neutral-500">
                    Target for general audience: grade 6–9.
                  </div>
                </div>

                {result && (
                  <div className="pt-4 border-t border-neutral-200">
                    <StyleReport before={result.before} after={result.after} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
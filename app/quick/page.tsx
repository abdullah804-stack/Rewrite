"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ProfilePicker } from "./ProfilePicker";
import { DiffView } from "./DiffView";
import { StyleReport } from "./StyleReport";
import { Editor } from "./Editor";
import { ProjectPicker } from "./ProjectPicker";
import { ThemeToggle } from "../ThemeToggle";
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

function chunkText(text: string, maxWords = 800): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWords = 0;

  for (const p of paragraphs) {
    const words = p.trim().split(/\s+/).length;
    if (currentWords + words > maxWords && currentChunk.length > 0) {
      chunks.push(currentChunk.join("\n\n"));
      currentChunk = [];
      currentWords = 0;
    }
    currentChunk.push(p);
    currentWords += words;
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n\n"));
  }
  return chunks;
}

const AUTOSAVE_KEY = "rewrite_autosave";

export default function QuickPage() {
  const [text, setText] = useState("");
  const [intensity, setIntensity] = useState<Intensity>("balanced");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [preset, setPreset] = useState<PresetId>("custom");
  const [seoSafe, setSeoSafe] = useState(false);
  
  const [formality, setFormality] = useState(5);
  const [directness, setDirectness] = useState(5);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [result, setResult] = useState<RewriteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capacityReached, setCapacityReached] = useState(false);
  const [copied, setCopied] = useState("");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [documentId, setDocumentId] = useState<string | null>(null);
  
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlText = params.get("text");
      
      if (urlText) {
        setText(urlText);
        window.history.replaceState({}, "", "/quick");
        return; // URL text takes priority
      }

      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        setText(saved);
        // Show a quick toast or status
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    }
  }, []);

  // Save to localStorage on change (debounced)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Don't save if it's empty
    if (!text) {
      localStorage.removeItem(AUTOSAVE_KEY);
      return;
    }

    setSaveStatus("saving");
    const timer = setTimeout(() => {
      localStorage.setItem(AUTOSAVE_KEY, text);
      setSaveStatus("saved");
    }, 800);

    return () => clearTimeout(timer);
  }, [text]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const analysis = useMemo(() => {
    if (!text.trim()) return null;
    return analyzeText(text, "general");
  }, [text]);

  async function handleRewrite() {
    if (wordCount > 5000) {
      setError("Text exceeds the 5,000 word limit for long-form mode.");
      return;
    }

    setLoading(true);
    setError(null);
    setCapacityReached(false);
    setResult(null);
    setProgress(null);

    try {
      const chunks = chunkText(text, 800);
      let fullRewritten = "";
      let lastProvider = "";
      let lastModel = "";
      let totalSpans = 0;

      for (let i = 0; i < chunks.length; i++) {
        if (chunks.length > 1) setProgress({ current: i + 1, total: chunks.length });

        const res = await fetch("/api/rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text: chunks[i], 
            intensity, 
            profileId, 
            preset, 
            seoSafe, 
            projectId,
            toneFormality: formality,
            toneDirectness: directness
          }),
        });

        const data = await res.json();

        if (res.status === 503) {
          setCapacityReached(true);
          return;
        }

        if (!res.ok || !data.ok) {
          setError(data.error ?? `Rewrite failed on section ${i + 1}.`);
          return;
        }

        fullRewritten += (i > 0 ? "\n\n" : "") + data.rewritten;
        lastProvider = data.provider;
        lastModel = data.model;
        totalSpans += data.spansProtected;
      }

      const finalData: RewriteResponse = {
        ok: true,
        original: text,
        rewritten: fullRewritten,
        provider: lastProvider,
        model: lastModel,
        before: analyzeText(text, "general").metrics,
        after: analyzeText(fullRewritten, "general").metrics,
        spansProtected: totalSpans,
        profileUsed: profileId ? { name: "Custom Voice" } : null,
      };

      setResult(finalData);

      if (typeof window !== "undefined") {
        fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            original: finalData.original,
            rewritten: finalData.rewritten,
            provider: finalData.provider,
            mode: "standard",
            profileId: profileId ?? undefined,
            projectId: projectId ?? undefined,
            styleReport: finalData.after,
            preset: preset,
          }),
        })
          .then((res) => res.json())
          .then((saved) => {
            if (saved?.document?.id) setDocumentId(saved.document.id);
            setHistoryRefreshKey((k) => k + 1);
          })
          .catch(() => {});
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setProgress(null);
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
    localStorage.removeItem(AUTOSAVE_KEY);
    setSaveStatus("idle");
  }

  return (
    <main className="h-screen flex flex-col bg-white dark:bg-neutral-950 text-black dark:text-white transition-colors overflow-hidden">
      <header className="border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-black dark:text-white">
              Rewrite
            </Link>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <Link href="/workspace" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
              Workspace
            </Link>
            {saveStatus !== "idle" && (
              <span className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5 ml-2">
                {saveStatus === "saving" ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Saved
                  </>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <Link
              href="/profiles"
              className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors hidden sm:inline"
            >
              Voices
            </Link>
            <Link
              href="/tools"
              className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors hidden sm:inline"
            >
              Free tools
            </Link>
          </div>
        </div>
      </header>

      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 shrink-0 px-4 sm:px-6 py-2 flex flex-wrap items-center gap-3 transition-colors">
        <div className="flex gap-1 bg-neutral-200/50 dark:bg-neutral-800 rounded-lg p-1">
          {(["light", "balanced", "strong"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setIntensity(level)}
              className={`h-7 px-3 rounded-md text-xs font-medium capitalize transition-colors ${
                intensity === level
                  ? "bg-white dark:bg-neutral-950 text-black dark:text-white shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="h-6 border-l border-neutral-300 dark:border-neutral-700 mx-1"></div>

        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value as PresetId)}
          className="h-8 px-2 pr-8 rounded-md border border-neutral-200 dark:border-neutral-700 text-xs text-black dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
        >
          {Object.entries(PRESETS).map(([id, p]) => (
            <option key={id} value={id}>
              {p.name}
            </option>
          ))}
        </select>

        <ProfilePicker value={profileId} onChange={setProfileId} />
        <ProjectPicker value={projectId} onChange={setProjectId} />

        <div className="flex items-center gap-4 ml-2 bg-white dark:bg-neutral-800 px-3 py-1 rounded-md border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Formal</span>
            <input
              type="range"
              min="1"
              max="10"
              value={formality}
              onChange={(e) => setFormality(Number(e.target.value))}
              className="w-16 accent-black dark:accent-white cursor-pointer"
            />
          </div>
          <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700"></div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Direct</span>
            <input
              type="range"
              min="1"
              max="10"
              value={directness}
              onChange={(e) => setDirectness(Number(e.target.value))}
              className="w-16 accent-black dark:accent-white cursor-pointer"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleRewrite}
            disabled={loading || !text.trim() || wordCount > 5000}
            className="h-8 px-4 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3 w-3 text-current" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {progress ? `Section ${progress.current}/${progress.total}...` : "Rewriting..."}
              </>
            ) : "Rewrite"}
          </button>
          {(text || result) && (
            <button
              type="button"
              onClick={handleReset}
              className="h-8 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 min-w-[300px] border-r border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center shrink-0 bg-white dark:bg-neutral-950 transition-colors">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              Your draft
            </span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              {wordCount} words
            </span>
          </div>
          <div className="flex-1 overflow-auto p-4 bg-white dark:bg-neutral-950 transition-colors">
            <Editor
              value={text}
              onChange={setText}
              profileId={profileId}
              onError={setError}
              onRewrite={handleRewrite}
            />
            {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </div>

        <div className="flex-1 min-w-[300px] border-r border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-900 transition-colors">
          <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center shrink-0 bg-neutral-50 dark:bg-neutral-900 transition-colors">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              Rewritten
            </span>
            {result && (
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                via {result.provider}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {capacityReached && (
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm">
                <div className="font-medium text-black dark:text-white mb-1">Capacity reached</div>
                <div className="text-neutral-500 dark:text-neutral-400 mb-3">All free AI providers are busy. Try again in a minute.</div>
                <button onClick={() => { setCapacityReached(false); handleRewrite(); }} className="text-black dark:text-white underline">Try again</button>
              </div>
            )}

            {!result && !capacityReached && !loading && (
              <div className="h-full flex items-center justify-center text-sm text-neutral-400 dark:text-neutral-500">
                {text ? "Click Rewrite to see the magic." : "Paste some text to begin."}
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-sm text-neutral-400 dark:text-neutral-500 gap-2">
                <svg className="animate-spin h-6 w-6 text-black dark:text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {progress ? `Rewriting section ${progress.current} of ${progress.total}...` : "Rewriting..."}
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

        <div className="w-80 shrink-0 flex flex-col overflow-hidden bg-white dark:bg-neutral-950 hidden xl:flex transition-colors">
          <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              Analysis
            </span>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-6">
            {!analysis && (
              <div className="text-sm text-neutral-400 dark:text-neutral-500">
                Start typing to see live analysis.
              </div>
            )}

            {analysis && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-black dark:text-white">AI-isms</span>
                    <span className="text-sm text-black dark:text-white">{analysis.lint.score}/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black dark:bg-white rounded-full transition-all"
                      style={{ width: `${analysis.lint.score}%` }}
                    />
                  </div>
                  {analysis.lint.hits.length > 0 && (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                      Found {analysis.lint.hits.length} phrases to fix.
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-black dark:text-white">Claims</span>
                    <span className="text-sm text-black dark:text-white">{analysis.claims.unsourcedCount} need source</span>
                  </div>
                  {analysis.claims.flags.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {analysis.claims.flags.slice(0, 3).map((c, i) => (
                        <div key={i} className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 p-2 rounded border border-neutral-100 dark:border-neutral-800">
                          &quot;{c.text}&quot;
                        </div>
                      ))}
                      {analysis.claims.flags.length > 3 && (
                        <div className="text-xs text-neutral-400 dark:text-neutral-500">+ more...</div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-black dark:text-white">Readability</span>
                    <span className="text-sm text-black dark:text-white">Grade {analysis.readability.grade}</span>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Target for general audience: grade 6–9.
                  </div>
                </div>

                {result && (
                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
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
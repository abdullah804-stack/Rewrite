"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ProfilePicker } from "./ProfilePicker";
import { DiffView } from "./DiffView";
import { StyleReport } from "./StyleReport";
import { Editor } from "./Editor";
import { ProjectPicker } from "./ProjectPicker";
import { analyzeText } from "@/lib/analyze-client";
import type { Metrics } from "@/lib/pipeline/metrics";
import { PRESETS, type PresetId } from "@/config/presets";
import { Avatar } from "@/lib/avatars";

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
  profileUsed: { name: string; avatar: string } | null;
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
  const [documentId, setDocumentId] = useState<string | null>(null);
  
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlText = params.get("text");
      
      if (urlText) {
        setText(urlText);
        window.history.replaceState({}, "", "/quick");
        return;
      }

      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        setText(saved);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
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
      let usedProfile = null;

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
        if (data.profileUsed) usedProfile = data.profileUsed;
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
        profileUsed: usedProfile,
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
    <main className="h-screen flex flex-col bg-surface-base text-text-primary transition-colors overflow-hidden">
      <header className="border-b border-surface-border shrink-0 bg-surface-base">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold tracking-tight flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
                R
              </div>
              Rewrite
            </Link>
            <span className="text-surface-border">/</span>
            <Link href="/workspace" className="text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors">
              Workspace
            </Link>
            {saveStatus !== "idle" && (
              <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5 ml-2 px-2 py-1 rounded bg-surface-raised">
                {saveStatus === "saving" ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Saved
                  </>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/profiles"
              className="text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors hidden sm:inline"
            >
              Voices
            </Link>
            <Link
              href="/tools"
              className="text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors hidden sm:inline"
            >
              Free tools
            </Link>
          </div>
        </div>
      </header>

      <div className="border-b border-surface-border bg-surface-raised shrink-0 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-4 transition-colors">
        <div className="flex gap-1 bg-surface-border p-1 rounded-lg">
          {(["light", "balanced", "strong"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setIntensity(level)}
              className={`h-8 px-4 rounded-md text-xs font-semibold capitalize transition-colors ${
                intensity === level
                  ? "bg-surface-base text-brand-600 shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="h-6 border-l border-surface-border hidden sm:block"></div>

        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value as PresetId)}
          className="h-9 px-3 pr-8 rounded-lg border border-surface-border text-sm font-medium text-text-primary bg-surface-base focus:outline-none focus:border-brand-500 transition-colors"
        >
          {Object.entries(PRESETS).map(([id, p]) => (
            <option key={id} value={id}>
              {p.name}
            </option>
          ))}
        </select>

        <ProfilePicker value={profileId} onChange={setProfileId} />
        <ProjectPicker value={projectId} onChange={setProjectId} />

        <div className="flex items-center gap-6 ml-2 bg-surface-base px-4 py-1.5 rounded-lg border border-surface-border shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">Formal</span>
            <input
              type="range"
              min="1"
              max="10"
              value={formality}
              onChange={(e) => setFormality(Number(e.target.value))}
              className="w-20 accent-brand-600 cursor-pointer"
            />
          </div>
          <div className="w-px h-4 bg-surface-border"></div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">Direct</span>
            <input
              type="range"
              min="1"
              max="10"
              value={directness}
              onChange={(e) => setDirectness(Number(e.target.value))}
              className="w-20 accent-brand-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={handleRewrite}
            disabled={loading || !text.trim() || wordCount > 5000}
            className="h-10 px-6 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:bg-surface-border disabled:text-text-secondary disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
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
              className="h-10 px-4 rounded-xl border border-surface-border text-sm font-semibold text-text-secondary hover:bg-surface-base transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 min-w-[300px] border-r border-surface-border flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-border flex justify-between items-center shrink-0 bg-surface-base">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Your draft
            </span>
            <span className="text-xs font-medium text-text-secondary">
              {wordCount} / 5,000 words
            </span>
          </div>
          <div className="flex-1 overflow-auto p-4 bg-surface-base">
            <Editor
              value={text}
              onChange={setText}
              profileId={profileId}
              onError={setError}
              onRewrite={handleRewrite}
            />
            {error && <p className="mt-4 text-sm font-medium text-red-600 p-3 bg-red-50 rounded-lg">{error}</p>}
          </div>
        </div>

        <div className="flex-1 min-w-[300px] border-r border-surface-border flex flex-col overflow-hidden bg-surface-raised">
          <div className="px-5 py-3 border-b border-surface-border flex justify-between items-center shrink-0 bg-surface-raised">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Rewritten
            </span>
            
            {result && (
              <div className="flex items-center gap-2 text-xs font-medium px-2 py-1 rounded bg-surface-base border border-surface-border text-text-secondary">
                {result.profileUsed && (
                  <>
                    <Avatar id={result.profileUsed.avatar || "minimalist"} className="w-4 h-4" />
                    <span className="text-text-primary font-bold">{result.profileUsed.name}</span>
                    <span className="text-surface-border">•</span>
                  </>
                )}
                <span>via {result.provider}</span>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto p-6">
            {capacityReached && (
              <div className="p-6 rounded-2xl border-2 border-brand-500 bg-surface-base text-sm shadow-sm">
                <div className="font-bold text-text-primary text-base mb-2">Capacity reached</div>
                <div className="text-text-secondary mb-4 leading-relaxed">All free AI providers are currently at capacity. This usually clears up within a minute.</div>
                <button onClick={() => { setCapacityReached(false); handleRewrite(); }} className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">Try again</button>
              </div>
            )}

            {!result && !capacityReached && !loading && (
              <div className="h-full flex items-center justify-center text-sm font-medium text-text-secondary">
                {text ? "Click Rewrite to see the magic." : "Paste some text to begin."}
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-sm font-medium text-text-secondary gap-3">
                <svg className="animate-spin h-8 w-8 text-brand-600" viewBox="0 0 24 24" fill="none">
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

        <div className="w-80 shrink-0 flex flex-col overflow-hidden bg-surface-base hidden xl:flex">
          <div className="px-5 py-3 border-b border-surface-border shrink-0 bg-surface-base">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Analysis
            </span>
          </div>
          <div className="flex-1 overflow-auto p-5 space-y-8">
            {!analysis && (
              <div className="text-sm font-medium text-text-secondary">
                Start typing to see live analysis.
              </div>
            )}

            {analysis && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-text-primary">AI-isms</span>
                    <span className="text-sm font-bold text-brand-600">{analysis.lint.score}/100</span>
                  </div>
                  <div className="h-2 w-full bg-surface-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full transition-all duration-300"
                      style={{ width: `${analysis.lint.score}%` }}
                    />
                  </div>
                  {analysis.lint.hits.length > 0 && (
                    <div className="text-xs font-medium text-text-secondary mt-2">
                      Found {analysis.lint.hits.length} phrases to fix.
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-text-primary">Claims</span>
                    <span className="text-sm font-bold text-brand-600">{analysis.claims.unsourcedCount} need source</span>
                  </div>
                  {analysis.claims.flags.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {analysis.claims.flags.slice(0, 3).map((c, i) => (
                        <div key={i} className="text-xs font-medium text-text-secondary bg-surface-raised p-3 rounded-lg border border-surface-border">
                          &quot;{c.text}&quot;
                        </div>
                      ))}
                      {analysis.claims.flags.length > 3 && (
                        <div className="text-xs font-semibold text-brand-600">+ more...</div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-text-primary">Readability</span>
                    <span className="text-sm font-bold text-brand-600">Grade {analysis.readability.grade}</span>
                  </div>
                  <div className="text-xs font-medium text-text-secondary">
                    Target for general audience: grade 6–9.
                  </div>
                </div>

                {result && (
                  <div className="pt-6 border-t border-surface-border">
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
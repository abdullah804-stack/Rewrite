"use client";

import { Logo } from "@/app/Logo";


import { useState, useMemo } from "react";


import Link from "next/link";

import { analyzeText } from "@/lib/analyze-client";

import { applyAllFixes } from "@/lib/pipeline/fixes";

import { categoryLabel } from "@/lib/pipeline/lint";

import { claimKindLabel } from "@/lib/pipeline/claims";

import { audienceLabel, type AudienceTarget } from "@/lib/pipeline/readability";




type Tab = "lint" | "claims" | "readability" | "meter";

const SAMPLE = `In today's fast-paced world, it is important to note that we must delve into the details. Studies show that 73% of users prefer seamless experiences, and experts say this will grow to 1,500,000 by 2027.`;

export default function ToolsPage() {
  const [text, setText] = useState("");
  const [tab, setTab] = useState<Tab>("lint");
  const [audience, setAudience] = useState<AudienceTarget>("general");
  const [fixedText, setFixedText] = useState<string | null>(null);

  const analysis = useMemo(() => {
    if (!text.trim()) return null;
    return analyzeText(text, audience);
  }, [text, audience]);

  function handleFixAll() {
    const { result } = applyAllFixes(text);
    setFixedText(result);
    setText(result);
  }

  function handleLoadSample() {
    setText(SAMPLE);
    setFixedText(null);
  }

  function handleClear() {
    setText("");
    setFixedText(null);
  }

  return (
    <main className="min-h-screen bg-surface-base dark:bg-surface-dark-base text-text-primary dark:text-text-dark-primary transition-colors">
      <header className="border-b border-surface-border dark:border-surface-dark-border sticky top-0 bg-surface-base/80 dark:bg-surface-dark-base/80 backdrop-blur-md z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4 sm:gap-6">
            
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-brand-600 dark:hover:text-brand-500 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-3xl mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-white">
            Free writing tools
          </h1>
          <p className="text-base text-text-secondary dark:text-text-dark-secondary mt-3 leading-relaxed">
            Runs entirely in your browser. No account. No AI. Paste text below to
            check for AI-isms, unsourced claims, and readability issues.
          </p>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button
            type="button"
            onClick={handleLoadSample}
            className="h-10 px-4 rounded-xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised text-sm font-medium text-text-primary dark:text-white hover:bg-surface-base dark:hover:bg-surface-dark-base transition-colors shadow-sm"
          >
            Load sample
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="h-10 px-4 rounded-xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised text-sm font-medium text-text-primary dark:text-white hover:bg-surface-base dark:hover:bg-surface-dark-base transition-colors shadow-sm"
          >
            Clear
          </button>
          {analysis && analysis.lint.hits.length > 0 && (
            <button
              type="button"
              onClick={handleFixAll}
              className="h-10 px-5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all shadow-sm"
            >
              Fix all AI-isms
            </button>
          )}
        </div>

        {/* Editor + results layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Editor */}
          <div>
            <label className="text-sm font-bold text-text-primary dark:text-white mb-2 block">
              Your text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste a draft from ChatGPT, Claude, or your own writing..."
              className="w-full h-64 sm:h-80 lg:h-[500px] p-5 rounded-2xl border border-surface-border dark:border-surface-dark-border bg-surface-base dark:bg-surface-dark-base text-sm text-text-primary dark:text-white placeholder:text-text-secondary dark:placeholder:text-text-dark-secondary focus:outline-none focus:border-brand-500 dark:focus:border-brand-500 resize-none shadow-sm transition-colors"
            />
            {text && (
              <div className="text-xs font-medium text-text-secondary dark:text-text-dark-secondary mt-3">
                {analysis?.metrics.wordCount ?? 0} words
                {fixedText !== null && " · fixed"}
              </div>
            )}
          </div>

          {/* Results */}
          <div>
            <div className="flex gap-1 bg-surface-raised dark:bg-surface-dark-raised border border-surface-border dark:border-surface-dark-border p-1 rounded-xl mb-6 shadow-sm">
              {(
                [
                  ["lint", "AI-isms"],
                  ["claims", "Claims"],
                  ["readability", "Readability"],
                  ["meter", "Style"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`flex-1 h-10 px-2 sm:px-4 rounded-lg text-sm font-semibold transition-colors ${
                    tab === key
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-white"
                  }`}
                >
                  {label}
                  {key === "lint" && analysis && analysis.lint.hits.length > 0 && (
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === "lint" ? "bg-white/20" : "bg-surface-border dark:bg-surface-dark-border"}`}>
                      {analysis.lint.hits.length}
                    </span>
                  )}
                  {key === "claims" && analysis && analysis.claims.unsourcedCount > 0 && (
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === "claims" ? "bg-white/20" : "bg-surface-border dark:bg-surface-dark-border"}`}>
                      {analysis.claims.unsourcedCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="min-h-[300px]">
              {!analysis && (
                <div className="text-sm text-text-secondary dark:text-text-dark-secondary py-16 text-center bg-surface-raised dark:bg-surface-dark-raised rounded-2xl border border-dashed border-surface-border dark:border-surface-dark-border">
                  Paste text to see results.
                </div>
              )}

              {analysis && tab === "lint" && (
                <LintPanel analysis={analysis} />
              )}

              {analysis && tab === "claims" && (
                <ClaimsPanel analysis={analysis} />
              )}

              {analysis && tab === "readability" && (
                <ReadabilityPanel
                  analysis={analysis}
                  audience={audience}
                  setAudience={setAudience}
                />
              )}

              {analysis && tab === "meter" && (
                <MeterPanel analysis={analysis} />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function LintPanel({ analysis }: { analysis: ReturnType<typeof analyzeText> }) {
  const { lint } = analysis;

  if (lint.hits.length === 0) {
    return (
      <div className="p-8 rounded-2xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised text-sm text-text-secondary dark:text-text-dark-secondary text-center">
        No AI-isms detected. Score: <span className="text-brand-600 font-bold ml-1">{lint.score}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
          Style score: <span className="text-brand-600 font-bold">{lint.score}</span>
        </span>
        <span className="text-xs font-semibold text-text-secondary dark:text-text-dark-secondary uppercase tracking-wide">
          {lint.hits.length} flagged
        </span>
      </div>

      <ul className="space-y-3">
        {lint.hits.map((hit, i) => (
          <li
            key={i}
            className="p-4 rounded-xl border border-surface-border dark:border-surface-dark-border bg-surface-base dark:bg-surface-dark-base shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <span className="text-sm font-bold text-text-primary dark:text-white">
                {hit.phrase}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary dark:text-text-dark-secondary px-2 py-1 rounded bg-surface-raised dark:bg-surface-dark-raised border border-surface-border dark:border-surface-dark-border">
                {categoryLabel(hit.category)}
              </span>
            </div>
            {hit.replacements.length > 0 && hit.replacements[0] !== "" && (
              <div className="text-xs text-text-secondary dark:text-text-dark-secondary mt-2">
                Try: <span className="font-medium text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded">{hit.replacements.join(", ")}</span>
              </div>
            )}
            {hit.replacements.length > 0 && hit.replacements[0] === "" && (
              <div className="text-xs text-text-secondary dark:text-text-dark-secondary mt-2">
                Try: <span className="font-medium text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded">remove</span>
              </div>
            )}
            <div className="text-xs text-text-secondary dark:text-text-dark-secondary mt-2 italic">{hit.notes}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ClaimsPanel({ analysis }: { analysis: ReturnType<typeof analyzeText> }) {
  const { claims } = analysis;

  if (claims.flags.length === 0) {
    return (
      <div className="p-8 rounded-2xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised text-sm text-text-secondary dark:text-text-dark-secondary text-center">
        No claims to check. This tool flags what needs a source; it cannot verify truth.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
          {claims.unsourcedCount} need a source
        </span>
        <span className="text-xs font-semibold text-text-secondary dark:text-text-dark-secondary uppercase tracking-wide">
          {claims.sourcedCount} sourced
        </span>
      </div>

      <ul className="space-y-3">
        {claims.flags.map((flag, i) => (
          <li
            key={i}
            className={`p-4 rounded-xl border shadow-sm ${
              flag.hasSource
                ? "border-surface-border dark:border-surface-dark-border bg-surface-base dark:bg-surface-dark-base"
                : "border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20"
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <span className="text-sm font-bold text-text-primary dark:text-white">{flag.text}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary dark:text-text-dark-secondary px-2 py-1 rounded bg-surface-raised dark:bg-surface-dark-raised border border-surface-border dark:border-surface-dark-border">
                {claimKindLabel(flag.kind)}
              </span>
            </div>
            <div className="text-xs font-medium text-text-secondary dark:text-text-dark-secondary mt-1">
              {flag.hasSource ? (
                <span className="text-green-600 dark:text-green-500">Source nearby</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-500">{flag.reason}</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-6 text-center">
        This tool surfaces claims that need a source. It cannot confirm they are true.
      </p>
    </div>
  );
}

function ReadabilityPanel({
  analysis,
  audience,
  setAudience,
}: {
  analysis: ReturnType<typeof analyzeText>;
  audience: AudienceTarget;
  setAudience: (a: AudienceTarget) => void;
}) {
  const { readability } = analysis;

  const audiences: AudienceTarget[] = [
    "general",
    "professional",
    "academic",
    "marketing",
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {audiences.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAudience(a)}
            className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
              audience === a
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-surface-raised dark:bg-surface-dark-raised border border-surface-border dark:border-surface-dark-border text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-white"
            }`}
          >
            {audienceLabel(a)}
          </button>
        ))}
      </div>

      <div className="p-8 rounded-2xl border border-surface-border dark:border-surface-dark-border bg-surface-base dark:bg-surface-dark-base shadow-sm mb-6">
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-extrabold text-brand-600">
            {readability.grade}
          </span>
          <span className="text-base font-semibold text-text-primary dark:text-white">{readability.label}</span>
        </div>
        <div className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary mt-3">
          Target for {audienceLabel(audience)}: grade {readability.targetRange.min}–{readability.targetRange.max}
        </div>
      </div>

      {readability.notes.length > 0 && (
        <ul className="space-y-2 mb-6">
          {readability.notes.map((note, i) => (
            <li key={i} className="text-sm text-text-secondary dark:text-text-dark-secondary bg-surface-raised dark:bg-surface-dark-raised p-3 rounded-xl border border-surface-border dark:border-surface-dark-border">
              {note}
            </li>
          ))}
        </ul>
      )}

      {readability.plainLanguageIssues.length > 0 && (
        <div>
          <div className="text-xs font-bold text-text-primary dark:text-white uppercase tracking-wide mb-3">
            Wordy phrases
          </div>
          <ul className="space-y-2">
            {readability.plainLanguageIssues.map((issue, i) => (
              <li key={i} className="text-sm text-text-secondary dark:text-text-dark-secondary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0"></span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MeterPanel({ analysis }: { analysis: ReturnType<typeof analyzeText> }) {
  const { metrics, lint } = analysis;

  const rows: [string, string | number][] = [
    ["Words", metrics.wordCount],
    ["Sentences", metrics.sentenceCount],
    ["Paragraphs", metrics.paragraphCount],
    ["Avg sentence length", metrics.sentenceLenMean],
    ["Sentence length variety", metrics.sentenceLenSd],
    ["Contractions", metrics.contractionRate],
    ["First person", metrics.firstPersonRate],
    ["Em dashes per 1k", metrics.emDashPer1k],
    ["Reading grade", metrics.readingGrade],
    ["Style score", lint.score],
  ];

  return (
    <div className="rounded-2xl border border-surface-border dark:border-surface-dark-border bg-surface-base dark:bg-surface-dark-base overflow-hidden shadow-sm">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between px-6 py-4 text-sm border-b border-surface-border dark:border-surface-dark-border last:border-0"
        >
          <span className="font-medium text-text-secondary dark:text-text-dark-secondary">{label}</span>
          <span className="font-bold text-text-primary dark:text-white">{value}</span>
        </div>
      ))}
      <div className="px-6 py-4 bg-surface-raised dark:bg-surface-dark-raised">
        <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
          Style score reflects AI-ism density, not detectability. It is a heuristic, not a detector.
        </p>
      </div>
    </div>
  );
}

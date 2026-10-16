"use client";

import { useState, useMemo } from "react";
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
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200 sticky top-0 bg-white/80 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/" className="text-sm font-medium text-black">
            Rewrite
          </a>
          <a
            href="/login"
            className="text-sm text-neutral-500 hover:text-black transition-colors"
          >
            Sign in
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-semibold text-black">
          Free writing tools
        </h1>
        <p className="text-sm text-neutral-500 mt-2 max-w-xl">
          Runs entirely in your browser. No account. No AI. Paste text below to
          check for AI-isms, unsourced claims, and readability issues.
        </p>

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          <button
            type="button"
            onClick={handleLoadSample}
            className="h-10 px-4 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Load sample
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="h-10 px-4 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Clear
          </button>
          {analysis && analysis.lint.hits.length > 0 && (
            <button
              type="button"
              onClick={handleFixAll}
              className="h-10 px-4 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Fix all AI-isms
            </button>
          )}
        </div>

        {/* Editor + results layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
          {/* Editor */}
          <div>
            <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Your text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste a draft from ChatGPT, Claude, or your own writing..."
              className="mt-2 w-full h-64 sm:h-80 lg:h-[500px] p-4 rounded-lg border border-neutral-200 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 resize-none"
            />
            {text && (
              <div className="text-xs text-neutral-400 mt-2">
                {analysis?.metrics.wordCount ?? 0} words
                {fixedText !== null && " · fixed"}
              </div>
            )}
          </div>

          {/* Results */}
          <div>
            <div className="flex gap-1 border-b border-neutral-200 overflow-x-auto">
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
                  className={`h-10 px-3 sm:px-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    tab === key
                      ? "border-black text-black"
                      : "border-transparent text-neutral-500 hover:text-black"
                  }`}
                >
                  {label}
                  {key === "lint" && analysis && analysis.lint.hits.length > 0 && (
                    <span className="ml-2 text-xs text-neutral-400">
                      {analysis.lint.hits.length}
                    </span>
                  )}
                  {key === "claims" && analysis && analysis.claims.unsourcedCount > 0 && (
                    <span className="ml-2 text-xs text-neutral-400">
                      {analysis.claims.unsourcedCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 min-h-[300px]">
              {!analysis && (
                <div className="text-sm text-neutral-400 py-12 text-center">
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
      <div className="text-sm text-neutral-500">
        No AI-isms detected. Score: <span className="text-black font-medium">{lint.score}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-neutral-500">
          Style score: <span className="text-black font-medium">{lint.score}</span>
        </span>
        <span className="text-xs text-neutral-400">
          {lint.hits.length} flagged
        </span>
      </div>

      <ul className="space-y-2">
        {lint.hits.map((hit, i) => (
          <li
            key={i}
            className="p-3 rounded-lg border border-neutral-200 text-sm"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-black font-medium">
                {hit.phrase}
              </span>
              <span className="text-xs text-neutral-400 px-2 py-0.5 rounded bg-neutral-100">
                {categoryLabel(hit.category)}
              </span>
            </div>
            {hit.replacements.length > 0 && hit.replacements[0] !== "" && (
              <div className="text-xs text-neutral-500 mt-1">
                Try: <span className="text-black">{hit.replacements.join(", ")}</span>
              </div>
            )}
            {hit.replacements.length > 0 && hit.replacements[0] === "" && (
              <div className="text-xs text-neutral-500 mt-1">
                Try: <span className="text-black">remove</span>
              </div>
            )}
            <div className="text-xs text-neutral-400 mt-1">{hit.notes}</div>
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
      <div className="text-sm text-neutral-500">
        No claims to check. This tool flags what needs a source; it cannot
        verify truth.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-neutral-500">
          {claims.unsourcedCount} need a source
        </span>
        <span className="text-xs text-neutral-400">
          {claims.sourcedCount} sourced
        </span>
      </div>

      <ul className="space-y-2">
        {claims.flags.map((flag, i) => (
          <li
            key={i}
            className={`p-3 rounded-lg border text-sm ${
              flag.hasSource
                ? "border-neutral-200 bg-white"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-black font-medium">{flag.text}</span>
              <span className="text-xs text-neutral-400 px-2 py-0.5 rounded bg-white border border-neutral-200">
                {claimKindLabel(flag.kind)}
              </span>
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {flag.hasSource ? "Source nearby" : flag.reason}
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs text-neutral-400 mt-4">
        This tool surfaces claims that need a source. It cannot confirm they are
        true.
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
      <div className="flex flex-wrap gap-1 mb-4">
        {audiences.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAudience(a)}
            className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
              audience === a
                ? "bg-black text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {audienceLabel(a)}
          </button>
        ))}
      </div>

      <div className="p-4 rounded-lg border border-neutral-200">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-black">
            {readability.grade}
          </span>
          <span className="text-sm text-neutral-500">{readability.label}</span>
        </div>
        <div className="text-xs text-neutral-400 mt-1">
          Target for {audienceLabel(audience)}: grade {readability.targetRange.min}–{readability.targetRange.max}
        </div>
      </div>

      {readability.notes.length > 0 && (
        <ul className="mt-4 space-y-2">
          {readability.notes.map((note, i) => (
            <li key={i} className="text-sm text-neutral-600">
              · {note}
            </li>
          ))}
        </ul>
      )}

      {readability.plainLanguageIssues.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Wordy phrases
          </div>
          <ul className="space-y-1">
            {readability.plainLanguageIssues.map((issue, i) => (
              <li key={i} className="text-sm text-neutral-600">
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
    <div className="rounded-lg border border-neutral-200 divide-y divide-neutral-200">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between px-4 py-3 text-sm"
        >
          <span className="text-neutral-500">{label}</span>
          <span className="text-black font-medium">{value}</span>
        </div>
      ))}
      <div className="px-4 py-3">
        <p className="text-xs text-neutral-400">
          Style score reflects AI-ism density, not detectability. It is a
          heuristic, not a detector.
        </p>
      </div>
    </div>
  );
}
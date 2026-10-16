"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DocumentSummary = {
  id: string;
  title: string;
  preset: string;
  updatedAt: string;
  revisionCount: number;
  latestRevisionId: string | null;
};

export function HistorySidebar({
  onRestore,
  refreshKey,
}: {
  onRestore: (text: string) => void;
  refreshKey: number;
}) {
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<
    { id: string; kind: string; content: string; wordCount: number; createdAt: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/documents");
        if (!res.ok) {
          setLoaded(true);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setDocs(data.documents ?? []);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function loadRevisions(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    setRevisions([]);

    try {
      const res = await fetch(`/api/documents/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setRevisions(data.document.revisions ?? []);
    } catch {
      // ignore
    }
  }

  if (!loaded) {
    return (
      <div className="text-xs text-neutral-400">Loading history…</div>
    );
  }

  if (docs.length === 0) {
    return (
      <div>
        <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
          History
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Signed-in rewrites are saved here for 14 days. Nothing yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
        History
      </div>

      <ul className="space-y-1">
        {docs.map((d) => {
          const isOpen = openId === d.id;
          return (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => loadRevisions(d.id)}
                className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                  isOpen
                    ? "bg-neutral-100 text-black"
                    : "text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <div className="truncate font-medium">{d.title}</div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  {new Date(d.updatedAt).toLocaleDateString()}
                </div>
              </button>

              {isOpen && (
                <ul className="mt-1 ml-2 pl-3 border-l border-neutral-200 space-y-1">
                  {revisions.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => onRestore(r.content)}
                        className="w-full text-left p-2 rounded-lg text-xs text-neutral-500 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-neutral-700">
                            {r.kind === "ORIGINAL" ? "Original" : "Rewrite"}
                          </span>
                          <span className="text-neutral-400">
                            {new Date(r.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="text-neutral-400 mt-0.5">
                          {r.wordCount} words
                        </div>
                      </button>
                    </li>
                  ))}
                  {revisions.length === 0 && (
                    <li className="text-xs text-neutral-400 py-2">
                      Loading…
                    </li>
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <Link
        href="/documents"
        className="inline-block mt-3 text-xs text-neutral-500 hover:text-black transition-colors"
      >
        View all →
      </Link>
    </div>
  );
}
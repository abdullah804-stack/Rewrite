"use client";

import { useState } from "react";

export function ShareButton({
  documentId,
  textToShare,
  onStatus,
}: {
  documentId: string | null;
  textToShare?: string;
  onStatus: (label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleShare(enable: boolean) {
    if (!documentId && !textToShare) {
      setError("Nothing to share yet.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const targetId = documentId || "guest";
      const res = await fetch(`/api/documents/${targetId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable, text: textToShare }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Share failed.");
        return;
      }

      setSlug(data.isPublic ? data.slug : null);
      onStatus(data.isPublic ? "Link created" : "Sharing off");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!slug) return;
    const url = `${window.location.origin}/s/${slug}`;
    await navigator.clipboard.writeText(url);
    onStatus("Link copied");
  }

  const shareUrl =
    slug && typeof window !== "undefined"
      ? `${window.location.origin}/s/${slug}`
      : null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 px-4 rounded-xl border border-surface-border dark:border-surface-dark-border text-xs font-semibold text-text-primary dark:text-white hover:bg-surface-base dark:hover:bg-surface-dark-base transition-colors shadow-sm"
      >
        Share
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-surface-border dark:border-surface-dark-border bg-surface-base dark:bg-surface-dark-base shadow-xl z-50 p-5">
          {!slug ? (
            <>
              <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary leading-relaxed mb-4">
                {documentId 
                  ? "Create a public read-only link. You can turn it off any time."
                  : "Save this rewrite with a temporary 24-hour link. No account required."}
              </p>
              {error && (
                <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-3">{error}</p>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleShare(true)}
                  disabled={loading}
                  className="h-9 px-4 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:bg-surface-border transition-colors shadow-sm"
                >
                  {loading ? "Creating…" : (documentId ? "Create link" : "Get magic link")}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-9 px-4 rounded-lg text-xs font-semibold text-text-secondary dark:text-text-dark-secondary hover:bg-surface-raised dark:hover:bg-surface-dark-raised transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-text-primary dark:text-white mb-2">Public link is on.</p>
              <div className="flex items-center gap-2 mb-3">
                <input
                  readOnly
                  value={shareUrl ?? ""}
                  className="flex-1 h-9 px-3 rounded-lg border border-surface-border dark:border-surface-dark-border text-xs font-medium text-text-primary dark:text-white bg-surface-raised dark:bg-surface-dark-raised"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="h-9 px-4 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-sm"
                >
                  Copy
                </button>
              </div>
              <button
                type="button"
                onClick={() => toggleShare(false)}
                disabled={loading}
                className="text-xs font-semibold text-text-secondary dark:text-text-dark-secondary hover:text-red-500 transition-colors"
              >
                {loading ? "Turning off…" : "Turn off sharing"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
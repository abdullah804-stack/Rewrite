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
    // If no documentId and no textToShare, we can't share.
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
        className="h-9 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
      >
        Share
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-72 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg z-20 p-4">
          {!slug ? (
            <>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {documentId 
                  ? "Create a public read-only link. You can turn it off any time."
                  : "Save this rewrite with a temporary 24-hour link. No account required."}
              </p>
              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => toggleShare(true)}
                  disabled={loading}
                  className="h-8 px-3 rounded-md bg-black dark:bg-white text-white dark:text-black text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 transition-colors"
                >
                  {loading ? "Creating…" : (documentId ? "Create link" : "Get magic link")}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-8 px-3 rounded-md text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Public link is on.</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl ?? ""}
                  className="flex-1 h-8 px-2 rounded-md border border-neutral-200 dark:border-neutral-700 text-xs text-black dark:text-white bg-neutral-50 dark:bg-neutral-800"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="h-8 px-3 rounded-md bg-black dark:bg-white text-white dark:text-black text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  Copy
                </button>
              </div>
              <button
                type="button"
                onClick={() => toggleShare(false)}
                disabled={loading}
                className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
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
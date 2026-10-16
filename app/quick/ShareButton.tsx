"use client";

import { useState } from "react";

export function ShareButton({
  documentId,
  onStatus,
}: {
  documentId: string | null;
  onStatus: (label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleShare(enable: boolean) {
    if (!documentId) {
      setError("Save a rewrite first to share it.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Share failed.");
        return;
      }

      setSlug(data.isPublic ? data.slug : null);
      onStatus(data.isPublic ? "Share link on" : "Sharing off");
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
        className="h-9 px-3 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
      >
        Share
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-72 rounded-lg border border-neutral-200 bg-white shadow-lg z-20 p-4">
          {!slug ? (
            <>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Create a public read-only link. Anyone with the link can view
                the rewrite. You can turn it off any time.
              </p>
              {error && (
                <p className="text-xs text-red-600 mt-2">{error}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => toggleShare(true)}
                  disabled={loading}
                  className="h-8 px-3 rounded-md bg-black text-white text-xs font-medium hover:bg-neutral-800 disabled:bg-neutral-300 transition-colors"
                >
                  {loading ? "Creating…" : "Create link"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-8 px-3 rounded-md text-xs font-medium text-neutral-500 hover:text-black transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-neutral-500">Public link is on.</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl ?? ""}
                  className="flex-1 h-8 px-2 rounded-md border border-neutral-200 text-xs text-black bg-neutral-50"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="h-8 px-3 rounded-md bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
                >
                  Copy
                </button>
              </div>
              <button
                type="button"
                onClick={() => toggleShare(false)}
                disabled={loading}
                className="mt-3 text-xs text-neutral-500 hover:text-black transition-colors"
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
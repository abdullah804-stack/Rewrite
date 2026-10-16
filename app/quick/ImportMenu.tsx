"use client";

import { useRef, useState } from "react";
import { parseFile, ACCEPTED_EXTENSIONS } from "@/lib/client/parse";

export function ImportMenu({
  onImported,
  onError,
}: {
  onImported: (text: string) => void;
  onError: (message: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    onError(null);
    setBusy(true);

    try {
      const results: string[] = [];
      for (const file of Array.from(files)) {
        const parsed = await parseFile(file);
        if (parsed.text.trim().length > 0) {
          results.push(parsed.text);
        }
      }
      if (results.length === 0) {
        onError("No readable text was found in the file.");
        return;
      }
      onImported(results.join("\n\n"));
      setOpen(false);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleUrl() {
    if (!url.trim()) return;
    onError(null);
    setUrlBusy(true);

    try {
      const res = await fetch("/api/import/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        onError(data.error ?? "Could not import that URL.");
        return;
      }

      onImported(data.text);
      setUrl("");
      setOpen(false);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setUrlBusy(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 px-3 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
      >
        Import
      </button>

      {open && (
        <div className="absolute left-0 mt-1 w-72 rounded-lg border border-neutral-200 bg-white shadow-lg z-20 p-4">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            From a file
          </div>

          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="w-full h-9 px-3 rounded-md border border-dashed border-neutral-300 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:text-neutral-300 transition-colors"
          >
            {busy ? "Reading…" : "Choose .txt .md .docx .pdf"}
          </button>

          <div className="border-t border-neutral-200 my-3" />

          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            From a URL
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="flex-1 h-8 px-2 rounded-md border border-neutral-200 text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
            />
            <button
              type="button"
              onClick={handleUrl}
              disabled={urlBusy || !url.trim()}
              className="h-8 px-3 rounded-md bg-black text-white text-xs font-medium hover:bg-neutral-800 disabled:bg-neutral-300 transition-colors"
            >
              {urlBusy ? "…" : "Fetch"}
            </button>
          </div>

          <p className="text-xs text-neutral-400 mt-2">
            Page text is extracted server-side. Nothing is stored.
          </p>
        </div>
      )}
    </div>
  );
}
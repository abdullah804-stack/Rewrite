"use client";

import { useState, useRef, useEffect } from "react";
import { exportAs, type ExportFormat } from "@/lib/client/export";

const FORMATS: { format: ExportFormat; label: string }[] = [
  { format: "txt", label: "Plain text (.txt)" },
  { format: "md", label: "Markdown (.md)" },
  { format: "html", label: "HTML (.html)" },
  { format: "docx", label: "Word (.docx)" },
];

export function ExportMenu({
  text,
  title,
  onCopied,
}: {
  text: string;
  title: string;
  onCopied: (label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    onCopied("Copied");
    setOpen(false);
  }

  async function handleExport(format: ExportFormat) {
    setBusy(true);
    try {
      await exportAs(format, text, title);
      onCopied(`Downloaded .${format}`);
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="h-9 px-4 rounded-lg bg-black text-white text-xs font-medium hover:bg-neutral-800 disabled:bg-neutral-300 transition-colors"
      >
        {busy ? "Preparing…" : "Export"}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 rounded-lg border border-neutral-200 bg-white shadow-lg z-20 overflow-hidden">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full text-left px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Copy to clipboard
          </button>
          <div className="border-t border-neutral-200" />
          {FORMATS.map((f) => (
            <button
              key={f.format}
              type="button"
              onClick={() => handleExport(f.format)}
              className="w-full text-left px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
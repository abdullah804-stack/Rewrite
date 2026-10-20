"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
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

  // Get the button's position to place the portal menu exactly under it
  const rect = buttonRef.current?.getBoundingClientRect();

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="h-9 px-4 rounded-lg bg-black text-white text-xs font-medium hover:bg-neutral-800 disabled:bg-surface-border transition-colors"
      >
        {busy ? "Preparing…" : "Export"}
      </button>

      {open && rect && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed w-48 rounded-lg border border-surface-border bg-surface-base shadow-xl z-[9999] overflow-hidden"
              style={{
                top: rect.bottom + 8,
                left: rect.left,
              }}
            >
              <button
                type="button"
                onClick={handleCopy}
                className="w-full text-left px-3 py-2.5 text-xs text-text-primary hover:bg-surface-raised transition-colors"
              >
                Copy to clipboard
              </button>
              <div className="border-t border-surface-border" />
              {FORMATS.map((f) => (
                <button
                  key={f.format}
                  type="button"
                  onClick={() => handleExport(f.format)}
                  className="w-full text-left px-3 py-2.5 text-xs text-text-primary hover:bg-surface-raised transition-colors"
                >
                  {f.label}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
"use client";

import { useRef, useEffect } from "react";
import { splitSentences } from "@/lib/pipeline/metrics";

export function HeatmapEditor({
  text,
  onChange,
  placeholder,
}: {
  text: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and overlay
  function handleScroll() {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }

  // Simple highlighting logic based on our metrics
  function renderHighlightedText() {
    if (!text) {
      return <span className="text-neutral-400 dark:text-neutral-500">{placeholder}</span>;
    }

    // Split by sentence, but keep the spaces/newlines
    const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
    
    return sentences.map((sentence, i) => {
      const words = sentence.trim().split(/\s+/).length;
      const isPassive = /\b(?:was|were|is|are|been|being|be)\s+\w+(?:ed|en)\b/i.test(sentence);
      const hasWordyPhrase = /\b(in order to|due to the fact that|at this point in time|prior to|has the ability to)\b/i.test(sentence);
      
      let bgClass = "";
      if (words > 25) {
        bgClass = "bg-red-200/50 dark:bg-red-900/40"; // Too long
      } else if (isPassive) {
        bgClass = "bg-yellow-200/50 dark:bg-yellow-900/40"; // Passive
      } else if (hasWordyPhrase) {
        bgClass = "bg-blue-200/50 dark:bg-blue-900/40"; // Wordy
      }

      return (
        <span key={i} className={bgClass}>
          {sentence}
        </span>
      );
    });
  }

  return (
    <div className="relative w-full h-full">
      {/* The colored background layer */}
      <div
        ref={overlayRef}
        className="absolute inset-0 p-4 text-sm leading-relaxed whitespace-pre-wrap break-words pointer-events-none overflow-hidden text-transparent"
        aria-hidden="true"
      >
        {renderHighlightedText()}
      </div>

      {/* The actual typing layer (transparent text) */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        className="absolute inset-0 w-full h-full p-4 text-sm leading-relaxed bg-transparent text-black dark:text-white caret-black dark:caret-white placeholder-transparent resize-none focus:outline-none z-10"
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
}
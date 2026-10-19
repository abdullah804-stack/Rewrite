"use client";

import { useRef, useEffect } from "react";

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

  function handleScroll() {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }

  function renderHighlightedText() {
    if (!text) {
      return <span className="text-text-secondary">{placeholder}</span>;
    }

    const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
    
    return sentences.map((sentence, i) => {
      const words = sentence.trim().split(/\s+/).length;
      const isPassive = /\b(?:was|were|is|are|been|being|be)\s+\w+(?:ed|en)\b/i.test(sentence);
      const hasWordyPhrase = /\b(in order to|due to the fact that|at this point in time|prior to|has the ability to)\b/i.test(sentence);
      
      let bgClass = "";
      if (words > 25) {
        bgClass = "bg-red-200/50"; 
      } else if (isPassive) {
        bgClass = "bg-yellow-200/50"; 
      } else if (hasWordyPhrase) {
        bgClass = "bg-blue-200/50"; 
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
      <div
        ref={overlayRef}
        className="absolute inset-0 p-4 text-sm leading-relaxed whitespace-pre-wrap break-words pointer-events-none overflow-hidden text-transparent"
        aria-hidden="true"
      >
        {renderHighlightedText()}
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        className="absolute inset-0 w-full h-full p-4 text-sm leading-relaxed bg-transparent text-text-primary caret-text-primary placeholder-transparent resize-none focus:outline-none z-10"
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
}
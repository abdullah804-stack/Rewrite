import React from "react";

export type AvatarId = "minimalist" | "storyteller" | "analyst" | "creator";

export const AVATARS: { id: AvatarId; name: string; description: string }[] = [
  { id: "minimalist", name: "The Minimalist", description: "Clean, direct, and professional." },
  { id: "storyteller", name: "The Storyteller", description: "Flowing, warm, and conversational." },
  { id: "analyst", name: "The Analyst", description: "Structured, logical, and academic." },
  { id: "creator", name: "The Creator", description: "Casual, energetic, and punchy." },
];

export function Avatar({ id, className = "w-8 h-8" }: { id: string; className?: string }) {
  const baseClass = `rounded-full flex items-center justify-center shrink-0 ${className}`;

  switch (id) {
    case "minimalist":
      return (
        <div className={`${baseClass} bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-1/2 h-1/2">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M9 9h6v6H9z" />
          </svg>
        </div>
      );
    case "storyteller":
      return (
        <div className={`${baseClass} bg-brand-50 dark:bg-brand-500/10 text-brand-600`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-1/2 h-1/2">
            <path d="M3 12c3-4 6-4 9 0s6 4 9 0" />
            <path d="M3 18c3-4 6-4 9 0s6 4 9 0" />
          </svg>
        </div>
      );
    case "analyst":
      return (
        <div className={`${baseClass} bg-blue-50 dark:bg-blue-500/10 text-blue-600`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-1/2 h-1/2">
            <path d="M3 3v18h18" />
            <path d="M18 9l-5 5-3-3-4 4" />
          </svg>
        </div>
      );
    case "creator":
    default:
      return (
        <div className={`${baseClass} bg-purple-50 dark:bg-purple-500/10 text-purple-600`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-1/2 h-1/2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      );
  }
}
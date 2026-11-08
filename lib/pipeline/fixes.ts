import { lint, findPhraseEntry, type LintHit } from "./lint";

export type FixSuggestion = {
  hit: LintHit;
  replacement: string | null; // null = delete the phrase
  display: string;
};

// Step 11: Phrases that are universally bad (fluff, corporate jargon, AI-isms)
// and can be safely removed or replaced without destroying context.
const STRONGLY_GENERIC_PHRASES = new Set([
  "in today's rapidly evolving world",
  "in the ever-evolving landscape",
  "it is important to note that",
  "it is worth noting that",
  "delve into",
  "tapestry of",
  "navigate the complexities",
  "unlock the potential",
  "at the end of the day",
  "think outside the box",
  "take it to the next level",
  "in conclusion",
  "to sum up",
  "first and foremost",
  "last but not least",
  "needless to say",
  "it goes without saying",
  "fast-paced world",
  "game-changer",
  "cutting-edge",
  "synergy",
  "paradigm shift",
]);

export function suggestFix(hit: LintHit): FixSuggestion {
  const entry = findPhraseEntry(hit.phrase);
  const replacements = entry?.replacements ?? hit.replacements;

  if (replacements.length === 0) {
    return {
      hit,
      replacement: null,
      display: "Remove",
    };
  }

  const first = replacements[0];
  if (first === "") {
    return {
      hit,
      replacement: null,
      display: "Remove",
    };
  }

  return {
    hit,
    replacement: first,
    display: first,
  };
}

export function applyFix(text: string, hit: LintHit, replacement: string | null): string {
  const before = text.slice(0, hit.start);
  const after = text.slice(hit.end);

  if (replacement === null) {
    // remove phrase, clean up double spaces
    return (before + after).replace(/\s{2,}/g, " ").replace(/\s+([.,!?;:])/g, "$1");
  }

  // preserve capitalization if the original started uppercase
  const original = text.slice(hit.start, hit.end);
  const startsUpper = original[0] === original[0].toUpperCase();
  const final = startsUpper
    ? replacement[0].toUpperCase() + replacement.slice(1)
    : replacement;

  return before + final + after;
}

export function applyAllFixes(text: string): { result: string; appliedCount: number } {
  const hits = lint(text).hits;
  if (hits.length === 0) return { result: text, appliedCount: 0 };

  // Apply from end to start so indexes stay valid
  const sorted = [...hits].sort((a, b) => b.start - a.start);
  let result = text;
  let applied = 0;

  for (const hit of sorted) {
    const phraseLower = hit.phrase.toLowerCase();

    // Step 11: Skip context-dependent phrases like "Furthermore", "Robust", 
    // or "Significantly" unless they are in the strongly generic list.
    // Use substring matching because the lint engine may match longer phrases
    // (e.g., "delve into the details" instead of just "delve into").
    const isStronglyGeneric = Array.from(STRONGLY_GENERIC_PHRASES).some((p) =>
      phraseLower.includes(p)
    );
    if (!isStronglyGeneric) {
      continue;
    }

    const suggestion = suggestFix(hit);
    result = applyFix(result, hit, suggestion.replacement);
    applied += 1;
  }

  return { result: result.trim(), appliedCount: applied };
}
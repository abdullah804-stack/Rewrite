import { splitSentences } from "./metrics";

export type DiffSegment = {
  original: string;
  rewritten: string;
  accepted: boolean;
  changed: boolean;
  reason: string;
};

export type DiffResult = {
  segments: DiffSegment[];
  unchangedCount: number;
  changedCount: number;
};

function normalizeSentence(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(s: string): Set<string> {
  return new Set(normalizeSentence(s).split(" ").filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function explainChange(original: string, rewritten: string): string {
  const origWords = original.trim().split(/\s+/).length;
  const newWords = rewritten.trim().split(/\s+/).length;
  const delta = newWords - origWords;

  const notes: string[] = [];

  if (Math.abs(delta) >= 5) {
    notes.push(
      delta > 0
        ? `Expanded by ${delta} words`
        : `Shortened by ${Math.abs(delta)} words`
    );
  }

  const hasContractionBefore = /\w+'(?:s|t|re|ve|ll|d|m)\b/i.test(original);
  const hasContractionAfter = /\w+'(?:s|t|re|ve|ll|d|m)\b/i.test(rewritten);
  if (!hasContractionBefore && hasContractionAfter) {
    notes.push("Added contraction");
  } else if (hasContractionBefore && !hasContractionAfter) {
    notes.push("Removed contraction");
  }

  const hasEmDashBefore = /—/.test(original);
  const hasEmDashAfter = /—/.test(rewritten);
  if (!hasEmDashBefore && hasEmDashAfter) {
    notes.push("Added em dash");
  } else if (hasEmDashBefore && !hasEmDashAfter) {
    notes.push("Removed em dash");
  }

  if (notes.length === 0) {
    notes.push("Reworded for natural rhythm");
  }

  return notes.join(" · ");
}

export function diffSentences(
  original: string,
  rewritten: string
): DiffResult {
  const origSentences = splitSentences(original);
  const newSentences = splitSentences(rewritten);

  // Greedy alignment: for each original sentence, find the closest rewritten
  // sentence that hasn't been used yet, in roughly the same position.
  const used = new Array(newSentences.length).fill(false);
  const segments: DiffSegment[] = [];

  for (let i = 0; i < origSentences.length; i++) {
    const orig = origSentences[i];

    // Look ahead in a small window to keep alignment stable
    const windowStart = i;
    const windowEnd = Math.min(newSentences.length, i + 3);

    let bestIndex = -1;
    let bestScore = -1;

    for (let j = windowStart; j < windowEnd; j++) {
      if (used[j]) continue;
      const score = jaccard(tokenSet(orig), tokenSet(newSentences[j]));
      if (score > bestScore) {
        bestScore = score;
        bestIndex = j;
      }
    }

    // Fallback: if nothing in the window, try anywhere
    if (bestIndex === -1) {
      for (let j = 0; j < newSentences.length; j++) {
        if (used[j]) continue;
        const score = jaccard(tokenSet(orig), tokenSet(newSentences[j]));
        if (score > bestScore) {
          bestScore = score;
          bestIndex = j;
        }
      }
    }

    if (bestIndex === -1) {
      // No rewritten sentence left — mark as unchanged for display
      segments.push({
        original: orig,
        rewritten: orig,
        accepted: true,
        changed: false,
        reason: "",
      });
      continue;
    }

    used[bestIndex] = true;
    const rew = newSentences[bestIndex];
    const changed = bestScore < 0.7;
    const reason = changed ? explainChange(orig, rew) : "";

    segments.push({
      original: orig,
      rewritten: rew,
      accepted: true,
      changed,
      reason,
    });
  }

  // Any leftover rewritten sentences get appended as new additions
  for (let j = 0; j < newSentences.length; j++) {
    if (used[j]) continue;
    segments.push({
      original: "",
      rewritten: newSentences[j],
      accepted: true,
      changed: true,
      reason: "Added sentence",
    });
  }

  const changedCount = segments.filter((s) => s.changed).length;
  const unchangedCount = segments.length - changedCount;

  return { segments, unchangedCount, changedCount };
}

export function assembleAccepted(diff: DiffResult): string {
  return diff.segments
    .map((s) => {
      if (!s.changed) return s.original;
      return s.accepted ? s.rewritten : s.original;
    })
    .filter((s) => s.length > 0)
    .join(" ")
    .trim();
}

export function assembleOriginal(diff: DiffResult): string {
  return diff.segments
    .map((s) => s.original)
    .filter((s) => s.length > 0)
    .join(" ")
    .trim();
}
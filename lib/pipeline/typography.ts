/**
 * Character-level clean-up applied to the final text. Models emit characters people almost never type:
 * non-breaking hyphens, non-breaking spaces, zero-width characters, curly quotes mixed with straight ones,
 * and em dashes. They are a cheap fingerprint, so the output uses the plain characters.
 * Run it on the text with protected spans still masked, so quotes, URLs and code are never altered.
 */
export function normalizeTypography(s: string): string {
  return s
    .replace(/[‐‑‒⁃]/g, "-")
    .replace(/[   ]/g, " ")
    .replace(/[​-‍⁠﻿]/g, "")
    .replace(/[“”„]/g, '"')
    .replace(/[‘’‚]/g, "'")
    // a pair of em dashes around an aside becomes parentheses; a lone em dash becomes a comma
    .replace(/\s*—([^—.!?\n]{2,120}?)—\s*/g, " ($1) ")
    .replace(/\s*—\s*/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ");
}

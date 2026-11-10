import { readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join } from "path";

const FIXTURES = "fixtures";
const folders = [
  "ai-drafts",
  "adversarial",
  "clean",
  "genres",
  "messy",
  "claims",
  "target-voice",
];

// Common HTML entity map. Add more as they appear in failed fixtures.
const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": " ",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "…",
  "&#148;": '"', // Windows-1252 curly close double quote
  "&#147;": '"', // Windows-1252 curly open double quote
  "&#146;": "'", // Windows-1252 curly close single quote
  "&#145;": "'", // Windows-1252 curly open single quote
  "&#133;": "…",
  "&#150;": "–",
  "&#151;": "—",
  "&#8220;": '"',
  "&#8221;": '"',
  "&#8216;": "'",
  "&#8217;": "'",
  "&#8230;": "…",
};

function decodeEntities(text: string): string {
  let result = text;
  // Named entities
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    result = result.split(entity).join(char);
  }
  // Generic numeric entities (&#123; and &#x7B;)
  result = result.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
  result = result.replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
  return result;
}

function normalizeQuotes(text: string): string {
  return text
    .replace(/[\u201C\u201D]/g, '"')   // curly double → straight double
    .replace(/[\u2018\u2019]/g, "'"); // curly single → straight single
}

function cleanText(text: string): string {
  let result = decodeEntities(text);
  result = normalizeQuotes(result);
  // Collapse runs of 3+ newlines to 2 (paragraph separator), then normalize line endings
  result = result.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  // Collapse multiple spaces / tabs (but preserve single spaces)
  result = result.replace(/[ \t]{2,}/g, " ");
  return result.trim();
}

let totalFiles = 0;
let changedFiles = 0;

for (const folder of folders) {
  const dir = join(FIXTURES, folder);
  try {
    statSync(dir);
  } catch {
    continue;
  }

  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".txt")) continue;
    const path = join(dir, file);
    const original = readFileSync(path, "utf-8");
    const cleaned = cleanText(original);
    totalFiles++;
    if (cleaned !== original) {
      writeFileSync(path, cleaned, "utf-8");
      changedFiles++;
      console.log(`  ✓ cleaned: ${path}`);
    }
  }
}

console.log(`\nScanned ${totalFiles} files, cleaned ${changedFiles}.`);
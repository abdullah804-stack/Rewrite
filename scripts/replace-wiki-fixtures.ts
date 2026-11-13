import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

const CLEAN_DIR = join("fixtures", "clean");
const GENRES_DIR = join("fixtures", "genres");
const VOICE_DIR = join("fixtures", "target-voice");

const GUTENBERG_FILES = [
  "01-gutenberg.txt",
  "02-gutenberg.txt",
  "03-gutenberg.txt",
  "04-gutenberg.txt",
  "05-gutenberg.txt",
  "06-gutenberg.txt",
  "07-gutenberg.txt",
  "08-gutenberg.txt",
  "09-gutenberg.txt",
];

// 9 slots for the 9 clean Gutenberg paragraphs
const CLEAN_TARGETS = [
  "11-wikipedia.txt",
  "12-wikipedia.txt",
  "13-wikipedia.txt",
  "14-wikipedia.txt",
  "15-wikipedia.txt",
  "16-wikipedia.txt",
  "17-wikipedia.txt",
  "18-wikipedia.txt",
  "19-wikipedia.txt",
];

// 20 is deleted because there is no clean 10th paragraph
const DELETE_FILE = "20-wikipedia.txt";

function clean(text: string): string {
  return text
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// ---- 1. Replace clean/11 through clean/19 with Gutenberg excerpts ----
console.log("=== Replacing clean/11-19 with Gutenberg excerpts ===\n");

const corpusParts: string[] = [];
for (const f of GUTENBERG_FILES) {
  try {
    const text = clean(readFileSync(join(CLEAN_DIR, f), "utf-8"));
    if (text.length > 100) corpusParts.push(text);
  } catch {
    console.log(`  ✗ Could not read ${f}`);
  }
}

if (corpusParts.length < CLEAN_TARGETS.length) {
  console.log(`✗ Only ${corpusParts.length} source files found, need ${CLEAN_TARGETS.length}.`);
  process.exit(1);
}

let replaced = 0;
for (let i = 0; i < CLEAN_TARGETS.length; i++) {
  const excerpt = corpusParts[i];
  writeFileSync(join(CLEAN_DIR, CLEAN_TARGETS[i]), excerpt, "utf-8");
  console.log(`  ✓ ${CLEAN_TARGETS[i]} (${excerpt.split(/\s+/).length} words) ← ${GUTENBERG_FILES[i]}`);
  replaced++;
}

// ---- 2. Delete clean/20 (no clean source) ----
const delPath = join(CLEAN_DIR, DELETE_FILE);
if (existsSync(delPath)) {
  unlinkSync(delPath);
  console.log(`  ✓ deleted ${DELETE_FILE} (no clean source available)`);
}

// ---- 3. Replace genres/02-academic.txt with Huxley excerpt ----
console.log("\n=== Replacing genres/02-academic.txt with Huxley academic prose ===\n");

const huxleyPath = join(VOICE_DIR, "07-personaB.txt");
try {
  const huxleyText = clean(readFileSync(huxleyPath, "utf-8"));
  if (huxleyText.length < 200) {
    throw new Error(`Huxley source too short (${huxleyText.length} chars)`);
  }
  writeFileSync(join(GENRES_DIR, "02-academic.txt"), huxleyText, "utf-8");
  console.log(`  ✓ genres/02-academic.txt ← 07-personaB.txt (${huxleyText.split(/\s+/).length} words)`);
} catch (err) {
  console.log(`  ✗ Could not replace genres/02-academic.txt: ${(err as Error).message}`);
}

// ---- 4. Summary ----
console.log(`\n=== Summary ===`);
console.log(`Replaced ${replaced} clean fixtures, deleted 1.`);
console.log(`Replaced genres/02-academic.txt with clean Huxley prose.`);
console.log(`\nNow run: $env:EVAL_PROVIDERS="groq"; npx tsx scripts/eval.ts`);
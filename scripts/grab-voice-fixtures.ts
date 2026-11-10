import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const VOICE_DIR = join("fixtures", "target-voice");
if (!existsSync(VOICE_DIR)) mkdirSync(VOICE_DIR, { recursive: true });

// Use the pglaf.org mirror instead of www.gutenberg.org (bot-friendly)
const MIRROR = "https://gutenberg.pglaf.org";

async function fetchWithRetry(url: string): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`  Fetching: ${url}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.text();
    } catch (err) {
      console.log(`  Attempt ${attempt} failed: ${(err as Error).message}`);
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error("unreachable");
}

function stripBoilerplate(text: string): string {
  const startMatch = text.match(/\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG[^\n]*\*\*\*/i);
  const endMatch = text.match(/\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG[^\n]*\*\*\*/i);
  let result = text;
  if (startMatch?.index !== undefined) result = result.slice(startMatch.index + startMatch[0].length);
  if (endMatch?.index !== undefined) result = result.slice(0, endMatch.index);
  return result;
}

function clean(text: string): string {
  return text
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractExcerpts(text: string, count: number): string[] {
  // Gutenberg plain-text files have hard line breaks every ~10 words.
  // We need to join lines into real paragraphs first.
  // Strategy: split on blank lines OR on lines ending with sentence-ending
  // punctuation followed by a line that starts with a capital letter.
  const cleaned = stripBoilerplate(text)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ");

  // Split on blank lines (paragraph breaks)
  let paragraphs = cleaned.split(/\n{2,}/);

  // If we got too few paragraphs, the book uses single-line breaks.
  // Join lines between blank lines.
  if (paragraphs.length < 20) {
    // Join all lines that don't have a blank line between them
    paragraphs = cleaned
      .split(/\n+/)
      .reduce((acc: string[], line) => {
        const trimmed = line.trim();
        if (!trimmed) return acc;
        // If the previous line ended with sentence punctuation and this starts
        // with a capital, it's a new paragraph
        if (acc.length > 0) {
          const prev = acc[acc.length - 1];
          const endsWithPunct = /[.!?"]$/.test(prev);
          const startsUpper = /^[A-Z"']/.test(trimmed);
          const prevShort = prev.split(/\s+/).length < 5;
          if (endsWithPunct && startsUpper && !prevShort) {
            acc.push(trimmed);
            return acc;
          }
          acc[acc.length - 1] = prev + " " + trimmed;
          return acc;
        }
        acc.push(trimmed);
        return acc;
      }, []);
  }

  // Clean each paragraph
  const cleanedParas = paragraphs
    .map((p) => clean(p))
    .filter((p) => {
      const words = p.split(/\s+/).length;
      return words >= 100 && words <= 800;
    });

  console.log(`  Found ${cleanedParas.length} paragraphs matching 100-800 words`);

  if (cleanedParas.length === 0) {
    // Diagnostic: dump a sample to see what's happening
    console.log(`  DIAGNOSTIC — first 500 chars of text:`);
    console.log(`  ${cleaned.slice(0, 500).replace(/\n/g, "\\n")}`);
    return [];
  }

  const picked: string[] = [];
  const step = Math.max(1, Math.floor(cleanedParas.length / count));
  for (let i = 0; i < count && i * step < cleanedParas.length; i++) {
    picked.push(cleanedParas[i * step]);
  }
  return picked;
}
const SOURCES = [
  {
    label: "Mark Twain Letters (Casual)",
    // Mirror path: /cache/epub/3199/pg3199.txt
    url: `${MIRROR}/cache/epub/3199/pg3199.txt`,
    prefix: "personaA",
    startIdx: 2,
    count: 5,
  },
  {
    label: "Huxley Science & Education (Academic)",
    url: `${MIRROR}/cache/epub/7150/pg7150.txt`,
    prefix: "personaB",
    startIdx: 7,
    count: 5,
  },
  {
    label: "Jane Austen Letters (Warm)",
    url: `${MIRROR}/cache/epub/42078/pg42078.txt`,
    prefix: "personaC",
    startIdx: 12,
    count: 4,
  },
];

async function main() {
  console.log("=== Grabbing voice fixtures ===\n");

  for (const source of SOURCES) {
    console.log(`Processing ${source.label}...`);
    try {
      const text = await fetchWithRetry(source.url);
      console.log(`  Downloaded ${text.length} characters`);
      
      const excerpts = extractExcerpts(text, source.count);
      console.log(`  Extracted ${excerpts.length} excerpts`);
      
      for (let i = 0; i < excerpts.length; i++) {
        const idx = String(source.startIdx + i).padStart(2, "0");
        const filename = join(VOICE_DIR, `${idx}-${source.prefix}.txt`);
        writeFileSync(filename, excerpts[i], "utf-8");
        console.log(`  ✓ ${filename} (${excerpts[i].split(/\s+/).length} words)`);
      }
      console.log();
    } catch (err) {
      console.log(`  ✗ FAILED: ${(err as Error).message}\n`);
    }
  }

  console.log("Done. voice-01.txt is untouched.");
}

main().catch(console.error);
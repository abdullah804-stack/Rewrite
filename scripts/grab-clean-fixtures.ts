import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const FIXTURES = "fixtures";
const CLEAN_DIR = join(FIXTURES, "clean");

// Ensure the folder exists
if (!existsSync(CLEAN_DIR)) mkdirSync(CLEAN_DIR, { recursive: true });

// Gutendex is a free, open API for Project Gutenberg metadata.
// No auth required. We'll search for a few classic texts and download the plain text.
const GUTENDEX_SEARCHES = [
  "pride and prejudice",
  "moby dick",
  "frankenstein",
  "the great gatsby",
  "alice in wonderland",
  "dracula",
  "the time machine",
  "heart of darkness",
  "the yellow wallpaper",
  "the tell-tale heart",
];

// Wikipedia REST API: fetch plain text extracts of well-known articles.
const WIKI_ARTICLES = [
  "Artificial intelligence",
  "Climate change",
  "Quantum mechanics",
  "Renaissance",
  "Photography",
  "Jazz",
  "The Great Depression",
  "Volcano",
  "Ancient Rome",
  "Coffee",
];

async function grabGutenberg() {
  console.log("Fetching 10 Project Gutenberg excerpts...");
  let count = 0;
  for (const query of GUTENDEX_SEARCHES) {
    try {
      const res = await fetch(
        `https://gutendex.com/books?search=${encodeURIComponent(query)}&languages=en`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const book = data.results?.[0];
      if (!book) {
        console.log(`  No book found for: ${query}`);
        continue;
      }

      // Get the plain text format URL
      const txtUrl =
        book.formats?.["text/plain; charset=us-ascii"] ||
        book.formats?.["text/plain"] ||
        book.formats?.["text/plain; charset=utf-8"];
      if (!txtUrl) {
        console.log(`  No plain text for: ${book.title}`);
        continue;
      }

      const textRes = await fetch(txtUrl);
      if (!textRes.ok) throw new Error(`HTTP ${textRes.status}`);
      let text = await textRes.text();

      // Strip Gutenberg header/footer boilerplate (between "*** START" and "*** END")
      const startMatch = text.match(/\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG[^\n]*\*\*\*/i);
      const endMatch = text.match(/\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG[^\n]*\*\*\*/i);
      if (startMatch && startMatch.index !== undefined) {
        text = text.slice(startMatch.index + startMatch[0].length);
      }
      if (endMatch && endMatch.index !== undefined) {
        text = text.slice(0, endMatch.index);
      }

      // Grab a 1500-character excerpt from the middle of the text (to avoid
      // opening lines / chapter headings and land on real prose)
      const mid = Math.floor(text.length / 2);
      let excerpt = text.slice(mid, mid + 1500).trim();
      // Clean up line breaks
      excerpt = excerpt.replace(/\n+/g, " ").replace(/\s{2,}/g, " ");

      const filename = join(CLEAN_DIR, `${String(count + 1).padStart(2, "0")}-gutenberg.txt`);
      writeFileSync(filename, excerpt, "utf-8");
      console.log(`  ✓ ${book.title} → ${filename}`);
      count++;
    } catch (err) {
      console.log(`  ✗ Failed for "${query}": ${(err as Error).message}`);
    }
  }
  return count;
}

async function grabWikipedia() {
  console.log("\nFetching 10 Wikipedia excerpts...");
  let count = 0;
  for (const title of WIKI_ARTICLES) {
    try {
      // Use the REST API's plain text extract endpoint
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const extract = data.extract;
      if (!extract || extract.length < 100) {
        console.log(`  Too short: ${title}`);
        continue;
      }

      // If summary is too short, fetch the full page HTML and extract text
      let text = extract;
      if (text.length < 800) {
        const htmlRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`
        );
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          // Crude HTML strip: remove tags, decode a few entities
          const stripped = html
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, " ")
            .replace(/\s{2,}/g, " ")
            .trim();
          text = stripped.slice(0, 1500);
        }
      } else {
        text = text.slice(0, 1500);
      }

      const filename = join(CLEAN_DIR, `${String(count + 11).padStart(2, "0")}-wikipedia.txt`);
      writeFileSync(filename, text, "utf-8");
      console.log(`  ✓ ${title} → ${filename}`);
      count++;
    } catch (err) {
      console.log(`  ✗ Failed for "${title}": ${(err as Error).message}`);
    }
  }
  return count;
}

async function main() {
  console.log("=== Grabbing clean human-written fixtures ===\n");
  const gCount = await grabGutenberg();
  const wCount = await grabWikipedia();
  console.log(`\nDone. ${gCount} Gutenberg + ${wCount} Wikipedia = ${gCount + wCount} files written to ${CLEAN_DIR}`);
  console.log("\nNote: Each file is a single excerpt. You may want to review them for length and quality.");
}

main().catch(console.error);
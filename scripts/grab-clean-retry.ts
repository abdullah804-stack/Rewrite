import { writeFileSync } from "fs";
import { join } from "path";

const CLEAN_DIR = join("fixtures", "clean");

const GUTENBERG_RETRY = [
  { query: "time machine wells", filename: "09-gutenberg.txt" },
  { query: "tales poe", filename: "10-gutenberg.txt" },
];

const WIKI_RETRY = [
  { title: "Roman Empire", filename: "20-wikipedia.txt" },
];

async function grabGutenberg() {
  for (const { query, filename } of GUTENBERG_RETRY) {
    try {
      console.log(`Fetching Gutenberg: ${query}`);
      const res = await fetch(
        `https://gutendex.com/books?search=${encodeURIComponent(query)}&languages=en`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const book = data.results?.[0];
      if (!book) {
        console.log(`  No match for: ${query}`);
        continue;
      }
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
      const startMatch = text.match(/\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG[^\n]*\*\*\*/i);
      const endMatch = text.match(/\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG[^\n]*\*\*\*/i);
      if (startMatch?.index !== undefined) {
        text = text.slice(startMatch.index + startMatch[0].length);
      }
      if (endMatch?.index !== undefined) {
        text = text.slice(0, endMatch.index);
      }
      const mid = Math.floor(text.length / 2);
      let excerpt = text.slice(mid, mid + 1500).trim().replace(/\n+/g, " ").replace(/\s{2,}/g, " ");
      writeFileSync(join(CLEAN_DIR, filename), excerpt, "utf-8");
      console.log(`  ✓ ${book.title} → ${filename}`);
    } catch (err) {
      console.log(`  ✗ Failed: ${(err as Error).message}`);
    }
  }
}

async function grabWikipedia() {
  for (const { title, filename } of WIKI_RETRY) {
    try {
      console.log(`Fetching Wikipedia: ${title}`);
      // Wait 2s to be polite about rate limits
      await new Promise((r) => setTimeout(r, 2000));
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const extract = data.extract;
      if (!extract) {
        console.log(`  No extract: ${title}`);
        continue;
      }
      writeFileSync(join(CLEAN_DIR, filename), extract.slice(0, 1500), "utf-8");
      console.log(`  ✓ ${title} → ${filename}`);
    } catch (err) {
      console.log(`  ✗ Failed: ${(err as Error).message}`);
    }
  }
}

async function main() {
  await grabGutenberg();
  await grabWikipedia();
  console.log("\nRetry done.");
}

main().catch(console.error);
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const GENRES_DIR = join("fixtures", "genres");
if (!existsSync(GENRES_DIR)) mkdirSync(GENRES_DIR, { recursive: true });

// ============================================================================
// 1. EMAIL (already working, keep as-is)
// ============================================================================
const EMAIL_URLS = [
  "https://www.gutenberg.org/files/56911/56911-h/56911-h.htm",
  "https://www.gutenberg.org/files/56911/56911-h/56911-h.htm#9",
];

async function grabEmails() {
  console.log("Fetching email samples from Gutenberg...");
  let count = 0;
  for (const url of EMAIL_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const stripped = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, "\n")
        .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
      const matches = stripped.match(/(?:Dear|Gentlemen)[\s\S]{100,800}?(?:Yours|Truly|Sincerely|Respectfully)[\s\S]{0,200}?\./gi);
      if (matches) {
        for (let i = 0; i < Math.min(4, matches.length); i++) {
          const excerpt = matches[i].replace(/\n+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 1200);
          if (excerpt.length > 200) {
            writeFileSync(join(GENRES_DIR, `${String(count + 1).padStart(2, "0")}-email.txt`), excerpt, "utf-8");
            console.log(`  ✓ ${count + 1}-email.txt (${excerpt.split(/\s+/).length} words)`);
            count++;
          }
        }
      }
      if (count >= 4) break;
    } catch (err) { console.log(`  ✗ Email failed: ${(err as Error).message}`); }
  }
  return count;
}

// ============================================================================
// 2. LEGAL (already working, keep as-is)
// ============================================================================
async function grabLegal() {
  console.log("\nFetching legal samples from SEC EDGAR...");
  const url = "https://www.sec.gov/Archives/edgar/data/1388195/000119312512146180/d328249dex41.htm";
  let count = 0;
  try {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await fetch(url, { headers: { "User-Agent": "RewriteEval/1.0 (contact@example.com)" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const stripped = html.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
    const chunkSize = Math.floor(stripped.length / 5);
    for (let i = 1; i <= 4; i++) {
      const excerpt = stripped.slice(i * chunkSize, i * chunkSize + 1200).trim();
      if (excerpt.length > 300) {
        writeFileSync(join(GENRES_DIR, `${String(count + 1).padStart(2, "0")}-legal.txt`), excerpt, "utf-8");
        console.log(`  ✓ ${count + 1}-legal.txt (${excerpt.split(/\s+/).length} words)`);
        count++;
      }
    }
  } catch (err) { console.log(`  ✗ Legal failed: ${(err as Error).message}`); }
  return count;
}

// ============================================================================
// 3. ACADEMIC — Wikipedia REST API (bot-friendly)
// ============================================================================
const WIKI_ACADEMIC = ["Scientific method", "Epistemology", "Peer review", "Academic publishing"];

async function grabAcademic() {
  console.log("\nFetching academic samples from Wikipedia...");
  let count = 0;
  for (const title of WIKI_ACADEMIC) {
    try {
      await new Promise((r) => setTimeout(r, 500));
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      let text = data.extract || "";
      // If summary is too short, fetch full HTML and strip
      if (text.length < 800) {
        const htmlRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`);
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          text = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
        }
      }
      text = text.slice(0, 1500);
      if (text.length > 300) {
        writeFileSync(join(GENRES_DIR, `${String(count + 1).padStart(2, "0")}-academic.txt`), text, "utf-8");
        console.log(`  ✓ ${count + 1}-academic.txt (${text.split(/\s+/).length} words) — ${title}`);
        count++;
      }
    } catch (err) { console.log(`  ✗ Academic failed (${title}): ${(err as Error).message}`); }
  }
  return count;
}

// ============================================================================
// 4. MARKETING — Internet Archive metadata API (bot-friendly)
// ============================================================================
async function grabMarketing() {
  console.log("\nFetching marketing samples from Internet Archive...");
  const identifier = "clockthathadnoha00kaufrich";
  let count = 0;
  try {
    const metaRes = await fetch(`https://archive.org/metadata/${identifier}`);
    if (!metaRes.ok) throw new Error(`Metadata HTTP ${metaRes.status}`);
    const meta = await metaRes.json();
    const files = meta.files || [];
    // Find the djvu.txt file (plain text)
    const txtFile = files.find((f: any) => f.name && f.name.endsWith("_djvu.txt"));
    if (!txtFile) throw new Error("No _djvu.txt file found");
    const txtUrl = `https://archive.org/download/${identifier}/${txtFile.name}`;
    console.log(`  Downloading: ${txtUrl}`);
    const txtRes = await fetch(txtUrl);
    if (!txtRes.ok) throw new Error(`TXT HTTP ${txtRes.status}`);
    const text = await txtRes.text();
    // Split into paragraphs and find advertising-related ones
    const paras = text.split(/\n{2,}/).map((p) => p.replace(/\n+/g, " ").replace(/\s{2,}/g, " ").trim()).filter((p) => p.length > 400 && p.length < 1500);
    const marketingParas = paras.filter((p) => /advertis|copy|selling|promise|publicity|merchant|newspaper|reader|store|trade|confidence|profit/i.test(p));
    for (let i = 0; i < Math.min(4, marketingParas.length); i++) {
      writeFileSync(join(GENRES_DIR, `${String(count + 1).padStart(2, "0")}-marketing.txt`), marketingParas[i], "utf-8");
      console.log(`  ✓ ${count + 1}-marketing.txt (${marketingParas[i].split(/\s+/).length} words)`);
      count++;
    }
  } catch (err) { console.log(`  ✗ Marketing failed: ${(err as Error).message}`); }
  return count;
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log("=== Grabbing genre fixtures ===\n");
  const e = await grabEmails();
  const l = await grabLegal();
  const a = await grabAcademic();
  const m = await grabMarketing();
  console.log(`\n=== Summary ===`);
  console.log(`Email: ${e}/4 | Legal: ${l}/4 | Academic: ${a}/4 | Marketing: ${m}/4`);
  console.log(`Total: ${e + l + a + m}/16`);
}

main().catch(console.error);
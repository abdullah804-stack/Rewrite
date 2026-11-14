/**
 * Usage:  npx tsx bench/run-bench.ts http://localhost:3000 [intensity] [preset]
 * Optional: COOKIE="next-auth.session-token=..." (so you are not limited by the anonymous quota)
 *
 * Sends every text in bench/corpus.json to your /api/rewrite, saves outputs to bench/out/,
 * and writes bench/results.csv. Paste each output into your detectors and fill in the
 * detector columns with the "% human" each tool reports (0-100), then run:
 *     npx tsx bench/analyze-results.ts
 */
import fs from "fs";
import { analyzeText } from "../lib/pipeline/aiTells";

const [base = "http://localhost:3000", intensity = "balanced", preset = "human"] = process.argv.slice(2);
const corpus: { id: string; text: string }[] = JSON.parse(fs.readFileSync("bench/corpus.json", "utf8"));
fs.mkdirSync("bench/out", { recursive: true });

const DETECTORS = ["stealthwriter", "zerogpt", "cleverhumanizer", "gptzero"];
const header = ["id", "words", "provider", "claims", "tell_score", "burstiness", "copied_bigrams", "persona", "stock", "similar_runs", "issues_left", ...DETECTORS];
const rows: string[][] = [];

(async () => {
  for (const item of corpus) {
    process.stdout.write(`${item.id} ... `);
    try {
      const res = await fetch(`${base}/api/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(process.env.COOKIE ? { Cookie: process.env.COOKIE } : {}) },
        body: JSON.stringify({ text: item.text, intensity, preset }),
      });
      const data: any = await res.json();
      if (!res.ok || !data.rewritten) { console.log(`FAILED (${res.status}) ${data.error ?? ""}`); rows.push([item.id, "", "", "", "", "", "", "", "", "", data.error ?? "failed", ...DETECTORS.map(() => "")]); continue; }
      fs.writeFileSync(`bench/out/${item.id}.txt`, data.rewritten);
      const r = analyzeText(data.rewritten, item.text);
      console.log(`score ${r.score.toFixed(1)}  burst ${r.burstiness.toFixed(2)}  via ${data.provider}`);
      rows.push([item.id, String(item.text.split(/\s+/).length), data.provider, String(!!data.tells?.usedClaimExtraction), r.score.toFixed(2), r.burstiness.toFixed(2),
        String(r.copiedBigrams.length), String(r.personaInserts.length), String(r.bannedHits.length), String(r.similarRuns.length), String(data.tells?.remaining?.length ?? ""), ...DETECTORS.map(() => "")]);
    } catch (e) { console.log("ERROR", (e as Error).message); }
  }
  fs.writeFileSync("bench/results.csv", [header, ...rows].map((r) => r.join(",")).join("\n"));
  const ok = rows.filter((r) => r[4] !== "").map((r) => Number(r[4]));
  console.log(`\n${ok.length}/${corpus.length} succeeded. local tell score: mean ${(ok.reduce((a, b) => a + b, 0) / Math.max(1, ok.length)).toFixed(2)}, max ${Math.max(...ok, 0).toFixed(2)}`);
  console.log("Now fill the detector columns in bench/results.csv and run: npx tsx bench/analyze-results.ts");
})();
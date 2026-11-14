/** Reads bench/results.csv (detector columns = % human, 0-100) and reports consistency + which local metrics predict your detectors. */
import fs from "fs";
const lines = fs.readFileSync("bench/results.csv", "utf8").trim().split(/\r?\n/).map((l) => l.split(",").map((c) => c.trim()));
const head = lines[0]; const rows = lines.slice(1);
const col = (n: string) => head.indexOf(n);
const detectors = ["stealthwriter", "zerogpt", "cleverhumanizer", "gptzero"].filter((d) => rows.some((r) => r[col(d)] !== ""));
const metrics = ["tell_score", "burstiness", "copied_bigrams", "persona", "stock", "similar_runs"];
const num = (r: string[], n: string) => Number(r[col(n)]);
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const sd = (a: number[]) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
const pearson = (x: number[], y: number[]) => { const mx = mean(x), my = mean(y); const n = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0); const d = Math.sqrt(x.reduce((s, v) => s + (v - mx) ** 2, 0) * y.reduce((s, v) => s + (v - my) ** 2, 0)); return d ? n / d : 0; };

if (!detectors.length) { console.log("Fill at least one detector column first."); process.exit(0); }
console.log("Per detector: mean % human, spread, share of texts at or above 65% (your target)");
for (const d of detectors) {
  const v = rows.map((r) => Number(r[col(d)])).filter((x) => !Number.isNaN(x) && x !== 0 || false);
  const all = rows.filter((r) => r[col(d)] !== "").map((r) => Number(r[col(d)]));
  console.log(`${d.padEnd(16)} mean ${mean(all).toFixed(0)}  sd ${sd(all).toFixed(0)}  min ${Math.min(...all)}  >=65: ${all.filter((x) => x >= 65).length}/${all.length}`);
}
console.log("\nCorrelation of each local metric with each detector's % human (negative tell_score correlation = my scorer agrees with the detector)");
console.log("metric".padEnd(16) + detectors.map((d) => d.slice(0, 12).padStart(14)).join(""));
for (const m of metrics) {
  console.log(m.padEnd(16) + detectors.map((d) => {
    const rs = rows.filter((r) => r[col(d)] !== "" && r[col(m)] !== "");
    return (rs.length > 2 ? pearson(rs.map((r) => num(r, m)), rs.map((r) => num(r, d))).toFixed(2) : "n/a").padStart(14);
  }).join(""));
}
console.log("\nWorst texts per detector (inspect these outputs in bench/out/):");
for (const d of detectors) {
  const w = rows.filter((r) => r[col(d)] !== "").sort((a, b) => Number(a[col(d)]) - Number(b[col(d)])).slice(0, 3).map((r) => `${r[0]}(${r[col(d)]})`);
  console.log(`${d.padEnd(16)} ${w.join(", ")}`);
}
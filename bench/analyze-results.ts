/**
 * Reads one or more bench runs and reports how consistent and how good the results are.
 *
 *   npx tsx bench/analyze-results.ts bench/runs/20261114-170000-baseline
 *   npx tsx bench/analyze-results.ts <runA> <runB>          (adds a side-by-side comparison)
 *   npx tsx bench/analyze-results.ts --target 70 <run>      (default target is 60 % human)
 *
 * With no path it uses the newest folder in bench/runs.
 * Detector columns are "% human" from 0 to 100. A blank cell means "not scored" (0 is a real score).
 */
import fs from "fs";
import path from "path";
import { DETECTORS, parseCsv, mean, median, quantile, pearson, fmt } from "./lib";

type Row = Record<string, string>;
type Run = { dir: string; label: string; meta: any; rows: Row[] };

const argv = process.argv.slice(2);
let target = 60;
const paths: string[] = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--target") target = Number(argv[++i]) || 60;
  else paths.push(argv[i]);
}

function newestRun(): string {
  const root = "bench/runs";
  if (!fs.existsSync(root)) { console.log("No bench/runs folder yet. Run bench/run-bench.ts first."); process.exit(1); }
  const dirs = fs.readdirSync(root).filter((d) => fs.existsSync(path.join(root, d, "results.csv"))).sort();
  if (!dirs.length) { console.log("No runs found in bench/runs."); process.exit(1); }
  return path.join(root, dirs[dirs.length - 1]);
}

function loadRun(p: string): Run {
  const csvPath = p.endsWith(".csv") ? p : path.join(p, "results.csv");
  const dir = path.dirname(csvPath);
  const table = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const head = table[0];
  const rows = table.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
  let meta: any = {};
  try { meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8")); } catch {}
  return { dir, label: meta.label ?? path.basename(dir), meta, rows };
}

const num = (s: string | undefined) => (s === undefined || s === "" || Number.isNaN(Number(s)) ? NaN : Number(s));
const scored = (rows: Row[], d: string) => rows.map((r) => num(r[d])).filter((x) => Number.isFinite(x));
const outputs = (run: Run) => run.rows.filter((r) => r.kind === "output" && !r.error);
const ofKind = (run: Run, k: string) => run.rows.filter((r) => r.kind === k);
const pad = (s: string, n: number) => s.padEnd(n);
const rpad = (s: string, n: number) => s.padStart(n);

function report(run: Run, detectors: string[]) {
  const outs = outputs(run);
  const failed = run.rows.filter((r) => r.kind === "output" && r.error);
  console.log(`\n==== ${run.label}  (${run.dir}) ====`);
  if (run.meta.commit) console.log(`commit ${run.meta.commit}, intensity ${run.meta.intensity}, preset ${run.meta.preset}, runs/text ${run.meta.runs}`);
  console.log(`outputs: ${outs.length} ok, ${failed.length} failed`);
  if (failed.length) console.log(`  failures: ${failed.slice(0, 5).map((f) => `${f.id}#${f.run} (${f.error.slice(0, 60)})`).join("; ")}`);

  // 1) shape of outputs vs controls, needs no detector data
  console.log("\n-- Shape (means). Compare output vs human: big gaps are patterns detectors can pick up --");
  const shapeCols = ["tell_score", "burstiness", "short_ratio", "long_short_pairs", "copied_bigrams", "persona", "stock"];
  console.log(pad("kind", 10) + rpad("n", 4) + shapeCols.map((c) => rpad(c, 18)).join(""));
  for (const k of ["output", "ai_input", "human"]) {
    const rs = k === "output" ? outs : ofKind(run, k);
    if (!rs.length) continue;
    console.log(pad(k, 10) + rpad(String(rs.length), 4) + shapeCols.map((c) => rpad(fmt(mean(rs.map((r) => num(r[c])).filter(Number.isFinite)), 2), 18)).join(""));
  }

  if (!detectors.length) {
    console.log("\nNo detector scores filled in yet. Fill the detector columns in results.csv and run this again.");
    return;
  }

  // 2) detector summary
  console.log(`\n-- Detector scores (% human). Target: ${target} or higher --`);
  console.log(pad("detector", 17) + ["scored", "median", "p25", "min", `>=${target}`, "rawAI med", "human med"].map((h) => rpad(h, 10)).join("") + "  note");
  for (const d of detectors) {
    const v = scored(outs, d);
    const ai = scored(ofKind(run, "ai_input"), d);
    const hu = scored(ofKind(run, "human"), d);
    const notes: string[] = [];
    if (hu.length && median(hu) < target) notes.push(`human text only gets ${fmt(median(hu))}: a ${target} target is not meaningful here`);
    if (ai.length && median(ai) >= 40) notes.push("barely flags raw AI text");
    if (!ai.length || !hu.length) notes.push("missing controls");
    console.log(
      pad(d, 17) + rpad(String(v.length), 10) + rpad(fmt(median(v)), 10) + rpad(fmt(quantile(v, 0.25)), 10) + rpad(fmt(Math.min(...v)), 10) +
      rpad(v.length ? `${v.filter((x) => x >= target).length}/${v.length}` : "n/a", 10) + rpad(fmt(median(ai)), 10) + rpad(fmt(median(hu)), 10) + "  " + notes.join("; ")
    );
  }

  // 3) run-to-run consistency
  console.log("\n-- Consistency: spread (max - min) between repeat runs of the same text --");
  for (const d of detectors) {
    const byId = new Map<string, number[]>();
    for (const r of outs) { const x = num(r[d]); if (Number.isFinite(x)) byId.set(r.id, [...(byId.get(r.id) ?? []), x]); }
    const spreads = [...byId.entries()].filter(([, v]) => v.length >= 2).map(([id, v]) => ({ id, spread: Math.max(...v) - Math.min(...v) }));
    if (!spreads.length) { console.log(`${pad(d, 17)} needs 2+ scored runs of the same text`); continue; }
    const wild = spreads.filter((s) => s.spread >= 40).map((s) => `${s.id}(${s.spread})`);
    console.log(`${pad(d, 17)} mean spread ${fmt(mean(spreads.map((s) => s.spread)))}, max ${fmt(Math.max(...spreads.map((s) => s.spread)))}${wild.length ? `, texts swinging 40+: ${wild.join(", ")}` : ""}`);
  }

  // 4) per model
  const groups = new Map<string, Row[]>();
  for (const r of outs) { const k = `${r.provider} / ${r.model}`; groups.set(k, [...(groups.get(k) ?? []), r]); }
  console.log("\n-- By model that wrote the text --");
  console.log(pad("model", 46) + rpad("n", 4) + detectors.map((d) => rpad(d.slice(0, 12), 14)).join(""));
  for (const [k, rs] of groups) {
    console.log(pad(k.slice(0, 45), 46) + rpad(String(rs.length), 4) + detectors.map((d) => { const v = scored(rs, d); return rpad(v.length ? `${fmt(median(v))} (n${v.length})` : "n/a", 14); }).join(""));
  }
  if (groups.size > 1) console.log("More than one model is mixed in this run. If their medians differ, that is part of your inconsistency.");

  // 5) which local metrics predict the detectors
  console.log("\n-- Correlation of local metrics with each detector's % human (outputs only, needs 8+ scored rows) --");
  const metrics = ["tell_score", "burstiness", "short_ratio", "long_short_pairs", "copied_bigrams", "persona", "stock"];
  console.log(pad("metric", 18) + detectors.map((d) => rpad(d.slice(0, 12), 14)).join(""));
  for (const m of metrics) {
    console.log(pad(m, 18) + detectors.map((d) => {
      const rs = outs.filter((r) => Number.isFinite(num(r[d])) && Number.isFinite(num(r[m])));
      return rpad(rs.length >= 8 ? fmt(pearson(rs.map((r) => num(r[m])), rs.map((r) => num(r[d]))), 2) : "n/a", 14);
    }).join(""));
  }
  console.log("(A metric is only useful as a target if it correlates with the detectors. tell_score should be clearly negative.)");

  // 6) worst outputs
  console.log("\n-- Lowest scoring outputs (open the files in the outputs folder) --");
  for (const d of detectors) {
    const w = outs.filter((r) => Number.isFinite(num(r[d]))).sort((a, b) => num(a[d]) - num(b[d])).slice(0, 5);
    if (w.length) console.log(`${pad(d, 17)} ${w.map((r) => `${r.id}.r${r.run}(${r[d]})`).join(", ")}`);
  }
}

const runs = (paths.length ? paths : [newestRun()]).map(loadRun);
const detectors = DETECTORS.filter((d) => runs.some((r) => r.rows.some((x) => Number.isFinite(num(x[d]))))) as string[];
for (const run of runs) report(run, detectors);

if (runs.length > 1 && detectors.length) {
  console.log("\n==== Side by side (outputs, median % human and share at or above target) ====");
  console.log(pad("run", 36) + detectors.map((d) => rpad(d.slice(0, 12), 16)).join(""));
  for (const run of runs) {
    const outs = outputs(run);
    console.log(pad(run.label.slice(0, 35), 36) + detectors.map((d) => {
      const v = scored(outs, d);
      return rpad(v.length ? `${fmt(median(v))}  ${v.filter((x) => x >= target).length}/${v.length}` : "n/a", 16);
    }).join(""));
  }
}

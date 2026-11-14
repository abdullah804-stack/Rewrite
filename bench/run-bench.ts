/**
 * Benchmark runner. See bench/README.md for the full workflow.
 *
 *   npx tsx bench/run-bench.ts --base http://localhost:3000 --runs 3 --label baseline
 *
 * Flags
 *   --base         server URL (default http://localhost:3000)
 *   --runs         rewrites per text (default 3, so you can measure run-to-run variance)
 *   --intensity    light | balanced | strong (default balanced)
 *   --preset       preset id from config/presets.ts (default human)
 *   --corpus       JSON file(s) of { id, text }, comma separated (default bench/corpus.json)
 *   --label        short name for this experiment, used in the folder name
 *   --limit        only use the first N corpus texts (smoke test)
 *   --delay        ms to wait between requests (default 3000, free tiers rate-limit)
 *   --no-controls  skip the human and raw-AI control rows
 *   --allow-cache  allow cached answers (otherwise runs > 1 needs BENCH_KEY)
 *
 * Env
 *   BENCH_KEY  must equal the BENCH_KEY set on the server. Makes the server skip its cache and quota.
 *   COOKIE     optional session cookie, e.g. "authjs.session-token=..."
 *
 * Output: bench/runs/<timestamp>-<label>/
 *   results.csv    one row per text and run; fill in the detector columns (% HUMAN, 0-100)
 *   paste-sheet.md every text you need to paste into the detectors, with its key
 *   outputs/       the rewritten texts
 *   meta.json      git commit, settings, providers actually used
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { analyzeText } from "../lib/pipeline/aiTells";
import { HEADER, DETECTORS, toCsv, wordCount, rhythmShape, type Kind } from "./lib";

const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(`--${name}`);
const opt = (name: string, def: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : def;
};

const base = opt("base", "http://localhost:3000");
let runs = Math.max(1, Number(opt("runs", "3")) || 3);
const intensity = opt("intensity", "balanced");
const preset = opt("preset", "human");
const corpusPath = opt("corpus", "bench/corpus.json");
const label = opt("label", "run").replace(/[^a-z0-9_-]/gi, "-");
const limit = Number(opt("limit", "0")) || 0;
const delay = Number(opt("delay", "3000")) || 0;
const benchKey = process.env.BENCH_KEY ?? "";
const MIN_WORDS_WARN = 150;

if (!benchKey && runs > 1 && !flag("allow-cache")) {
  console.log("BENCH_KEY is not set, so the server would return cached answers for repeat runs.");
  console.log("Set BENCH_KEY on the server and here (or pass --allow-cache). Falling back to --runs 1.\n");
  runs = 1;
}

type Item = { id: string; text: string };
const corpus: Item[] = corpusPath
  .split(",")
  .flatMap((f) => JSON.parse(fs.readFileSync(f.trim(), "utf8")) as Item[])
  .slice(0, limit || undefined);

const short = corpus.filter((c) => wordCount(c.text) < MIN_WORDS_WARN);
if (short.length) {
  console.log(`Warning: ${short.length} text(s) are under ${MIN_WORDS_WARN} words (${short.map((s) => s.id).join(", ")}).`);
  console.log("Detectors are unreliable on short text, so scores for these will be noisy.\n");
}

function loadControls(): Item[] {
  const out: Item[] = [];
  const clean = "fixtures/clean";
  if (fs.existsSync(clean)) {
    for (const f of fs.readdirSync(clean).filter((f) => /^\d+-gutenberg\.txt$/.test(f)).sort()) {
      out.push({ id: `gutenberg-${f.slice(0, 2)}`, text: fs.readFileSync(path.join(clean, f), "utf8").trim() });
    }
  }
  const mine = "bench/my-writing";
  if (fs.existsSync(mine)) {
    for (const f of fs.readdirSync(mine).filter((f) => f.endsWith(".txt")).sort()) {
      out.push({ id: `mine-${f.replace(/\.txt$/, "")}`, text: fs.readFileSync(path.join(mine, f), "utf8").trim() });
    }
  }
  return out;
}

function gitCommit(): string {
  try { return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { return "unknown"; }
}

const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
const dir = path.join("bench", "runs", `${stamp}-${label}`);
fs.mkdirSync(path.join(dir, "outputs"), { recursive: true });

const rows: string[][] = [HEADER];
const sheet: string[] = [];
const providersUsed = new Map<string, number>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function addRow(kind: Kind, id: string, run: string, text: string, original: string, extra: { provider?: string; model?: string; ms?: number; issues?: number; error?: string } = {}) {
  const r = analyzeText(text, original);
  const shape = rhythmShape(text);
  const blank = { ...Object.fromEntries(DETECTORS.map((d) => [d, ""])) };
  const cells: Record<string, string> = {
    kind, id, run, words: String(wordCount(text)),
    provider: extra.provider ?? "", model: extra.model ?? "", ms: extra.ms != null ? String(extra.ms) : "",
    tell_score: r.score.toFixed(2), burstiness: r.burstiness.toFixed(2),
    short_ratio: shape.shortRatio.toFixed(2), long_short_pairs: String(shape.longShortPairs),
    copied_bigrams: String(r.copiedBigrams.length), persona: String(r.personaInserts.length),
    stock: String(r.bannedHits.length), similar_runs: String(r.similarRuns.length),
    issues_left: extra.issues != null ? String(extra.issues) : "",
    ...blank, error: extra.error ?? "",
  };
  rows.push(HEADER.map((h) => cells[h] ?? ""));
  sheet.push(`### ${kind} | ${id} | run ${run}\n\n\`\`\`\n${text}\n\`\`\`\n`);
}

function addFailure(id: string, run: string, error: string, ms: number) {
  const cells: Record<string, string> = { kind: "output", id, run, ms: String(ms), error };
  rows.push(HEADER.map((h) => cells[h] ?? ""));
}

function save() {
  fs.writeFileSync(path.join(dir, "results.csv"), toCsv(rows));
  fs.writeFileSync(
    path.join(dir, "paste-sheet.md"),
    `# Paste sheet\n\nPaste each text into your detectors and enter the **% human** (0-100) in results.csv, in the row with the same kind / id / run.\nIf a detector reports % AI, enter 100 minus that.\n\n${sheet.join("\n")}`
  );
}

async function rewriteOnce(text: string): Promise<{ data: any; status: number }> {
  const res = await fetch(`${base}/api/rewrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(process.env.COOKIE ? { Cookie: process.env.COOKIE } : {}) },
    body: JSON.stringify({ text, intensity, preset, ...(benchKey ? { benchKey } : {}) }),
  });
  const data: any = await res.json().catch(() => ({}));
  return { data, status: res.status };
}

(async () => {
  const total = corpus.length * runs;
  let n = 0;
  console.log(`Running ${corpus.length} texts x ${runs} runs = ${total} rewrites  (intensity=${intensity}, preset=${preset})\n`);

  for (const item of corpus) {
    for (let k = 1; k <= runs; k++) {
      n++;
      process.stdout.write(`[${n}/${total}] ${item.id} r${k} ... `);
      const t0 = Date.now();
      try {
        let { data, status } = await rewriteOnce(item.text);
        if (status === 429 || status >= 500) { await sleep(5000); ({ data, status } = await rewriteOnce(item.text)); }
        const ms = Date.now() - t0;
        if (status !== 200 || !data.rewritten) {
          console.log(`FAILED (${status}) ${data.error ?? ""}`);
          addFailure(item.id, String(k), `${status} ${data.error ?? "no output"}`, ms);
        } else {
          const provider = String(data.provider ?? "");
          const model = String(data.model ?? "");
          providersUsed.set(`${provider} / ${model}`, (providersUsed.get(`${provider} / ${model}`) ?? 0) + 1);
          fs.writeFileSync(path.join(dir, "outputs", `${item.id}.r${k}.txt`), data.rewritten);
          addRow("output", item.id, String(k), data.rewritten, item.text, { provider, model, ms, issues: data.tells?.remaining?.length });
          console.log(`ok  ${provider}  tell ${rows[rows.length - 1][HEADER.indexOf("tell_score")]}  ${ms}ms${provider === "Cache" ? "  (CACHED!)" : ""}`);
        }
      } catch (e) {
        console.log("ERROR", (e as Error).message);
        addFailure(item.id, String(k), (e as Error).message, Date.now() - t0);
      }
      save();
      if (delay && n < total) await sleep(delay);
    }
  }

  if (!flag("no-controls")) {
    const controls = loadControls();
    for (const item of corpus) addRow("ai_input", item.id, "0", item.text, "");
    for (const c of controls) addRow("human", c.id, "0", c.text, "");
    console.log(`\nAdded ${corpus.length} raw-AI control rows and ${controls.length} human control rows.`);
    if (!controls.length) console.log("No human controls found (fixtures/clean/*-gutenberg.txt or bench/my-writing/*.txt).");
  }
  save();

  const meta = {
    when: new Date().toISOString(), label, commit: gitCommit(), base, intensity, preset, runs,
    texts: corpus.length, corpus: corpusPath, benchKeyUsed: !!benchKey,
    providersUsed: Object.fromEntries(providersUsed),
  };
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2));

  console.log(`\nSaved to ${dir}`);
  console.log(`Models actually used: ${[...providersUsed].map(([k, v]) => `${k} x${v}`).join(", ") || "none"}`);
  if (providersUsed.size > 1) console.log("Note: more than one model produced these outputs. Compare them separately in the analysis.");
  console.log(`\nNext: paste the texts in ${path.join(dir, "paste-sheet.md")} into your detectors,`);
  console.log(`fill the detector columns in results.csv, then run: npx tsx bench/analyze-results.ts ${dir}`);
})();

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * A/B workbench. Paste one AI text, it makes several rewrite variants (blind-labelled), you paste each into your
 * detectors and type the "% human" scores, and the table at the bottom ranks the variants across every text you
 * have tested. Everything is stored in this browser only. Needs the server's BENCH_KEY (skips quota and cache).
 */

type Variant = { id: string; name: string; body: Record<string, unknown> };

// Edit this list to compare other settings. Each variant is sent to /api/rewrite as-is.
const VARIANTS: Variant[] = [
  { id: "standard", name: "Standard prompt (Human preset)", body: { preset: "human", plainMode: false } },
  { id: "plain", name: "Plain mode (Stealth preset)", body: { preset: "stealth", plainMode: true } },
  { id: "standard-stealth", name: "Standard prompt + Stealth preset", body: { preset: "stealth", plainMode: false } },
];
const DETECTORS = ["StealthWriter", "CleverHumanizer"];
const TARGET = 60;
const STORE = "rewrite-bench-v1";

type Item = {
  id: string;
  session: string;
  label: string;
  variant: string; // variant id, or "raw" for the untouched AI text
  run: number;
  words: number;
  text: string;
  model: string;
  commas: number | null;
  fixScore: number | null;
  scores: Record<string, number | null>;
  error?: string;
};

const uid = () => Math.random().toString(36).slice(2, 10);
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const median = (a: number[]) => {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const shuffle = <T,>(a: T[]) => {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
};
const nameOf = (id: string) => (id === "raw" ? "Raw AI text (control)" : VARIANTS.find((v) => v.id === id)?.name ?? id);

export default function BenchPage() {
  const [key, setKey] = useState("");
  const [text, setText] = useState("");
  const [runs, setRuns] = useState(2);
  const [chosen, setChosen] = useState<string[]>(VARIANTS.map((v) => v.id));
  const [items, setItems] = useState<Item[]>([]);
  const [session, setSession] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      setKey(localStorage.getItem(STORE + "-key") ?? "");
      const saved = JSON.parse(localStorage.getItem(STORE) ?? "[]") as Item[];
      setItems(saved);
      setSession(saved.length ? saved[saved.length - 1].session : "");
    } catch {}
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(STORE, JSON.stringify(items)); } catch {}
  }, [items]);
  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(STORE + "-key", key); } catch {}
  }, [key]);

  const current = useMemo(() => items.filter((i) => i.session === session), [items, session]);

  async function generate() {
    setError(null);
    setReveal(false);
    if (!key.trim()) return setError("Enter the bench key (the BENCH_KEY value from Vercel).");
    if (words(text) < 150) return setError("Use a text of at least 150 words: detectors are unreliable on short text.");
    if (!chosen.length) return setError("Pick at least one variant.");
    const sid = uid();
    const label = text.trim().slice(0, 40).replace(/\s+/g, " ");
    const jobs = shuffle(chosen.flatMap((v) => Array.from({ length: runs }, (_, r) => ({ v, r: r + 1 }))));
    const control: Item = { id: uid(), session: sid, label, variant: "raw", run: 0, words: words(text), text: text.trim(), model: "", commas: null, fixScore: null, scores: {} };
    setSession(sid);
    setItems((prev) => [...prev, control]);

    let done = 0;
    const run = async (job: { v: string; r: number }) => {
      const variant = VARIANTS.find((x) => x.id === job.v)!;
      let item: Item = { id: uid(), session: sid, label, variant: job.v, run: job.r, words: 0, text: "", model: "", commas: null, fixScore: null, scores: {} };
      try {
        const res = await fetch("/api/rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, intensity: "balanced", benchKey: key.trim(), ...variant.body }),
        });
        const raw = await res.text();
        let data: any;
        try { data = JSON.parse(raw); } catch { throw new Error(`HTTP ${res.status}: ${raw.slice(0, 120)}`); }
        if (!res.ok || !data.rewritten) throw new Error(`${res.status} ${data.error ?? "no output"}`);
        item = { ...item, text: data.rewritten, words: words(data.rewritten), model: `${data.provider ?? ""} ${data.model ?? ""}`.trim(), commas: data.tells?.commasPerSentence ?? null, fixScore: data.tells?.fixScore ?? null };
      } catch (e) {
        item.error = (e as Error).message;
      }
      done++;
      setBusy(`Generating ${done}/${jobs.length}...`);
      setItems((prev) => [...prev, item]);
    };
    setBusy(`Generating 0/${jobs.length}...`);
    const queue = [...jobs];
    await Promise.all(Array.from({ length: 2 }, async () => { for (let j = queue.shift(); j; j = queue.shift()) await run(j); }));
    setBusy(null);
  }

  function setScore(id: string, det: string, v: string) {
    const n = v.trim() === "" ? null : Math.max(0, Math.min(100, Number(v)));
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, scores: { ...i.scores, [det]: Number.isFinite(n as number) ? n : null } } : i)));
  }

  const summary = useMemo(() => {
    const ids = ["raw", ...VARIANTS.map((v) => v.id)];
    return ids.map((id) => {
      const rows = items.filter((i) => i.variant === id && !i.error);
      return {
        id,
        n: rows.length,
        commas: median(rows.map((r) => r.commas).filter((x): x is number => x != null)),
        perDet: DETECTORS.map((d) => {
          const v = rows.map((r) => r.scores[d]).filter((x): x is number => typeof x === "number");
          return { d, n: v.length, med: median(v), min: v.length ? Math.min(...v) : NaN, ok: v.filter((x) => x >= TARGET).length };
        }),
      };
    }).filter((s) => s.n > 0);
  }, [items]);

  function exportCsv() {
    const head = ["session", "label", "variant", "run", "words", "commas", "fix_score", "model", ...DETECTORS, "error"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = items.map((i) => [i.session, i.label, i.variant, i.run, i.words, i.commas, i.fixScore, i.model, ...DETECTORS.map((d) => i.scores[d]), i.error].map(esc).join(","));
    const blob = new Blob([[head.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rewrite-bench.csv";
    a.click();
  }

  const scoredCount = items.filter((i) => Object.values(i.scores).some((x) => typeof x === "number")).length;
  const f = (n: number, d = 0) => (Number.isFinite(n) ? n.toFixed(d) : "-");

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6 text-sm">
      <header>
        <h1 className="text-xl font-semibold">Variant workbench</h1>
        <p className="text-neutral-500">
          1) Paste an AI text. 2) Generate variants (labels are hidden). 3) Paste each text into your detectors and type the <b>% human</b>. 4) Reveal. Repeat with 5 to 10 different texts before drawing any conclusion.
        </p>
      </header>

      <section className="space-y-3 rounded-lg border border-neutral-200 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2">Bench key
            <input type="password" value={key} onChange={(e) => setKey(e.target.value)} className="border rounded px-2 py-1 w-56" placeholder="BENCH_KEY from Vercel" />
          </label>
          <label className="flex items-center gap-2">Runs per variant
            <select value={runs} onChange={(e) => setRuns(Number(e.target.value))} className="border rounded px-2 py-1">
              {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-4">
          {VARIANTS.map((v) => (
            <label key={v.id} className="flex items-center gap-2">
              <input type="checkbox" checked={chosen.includes(v.id)} onChange={(e) => setChosen((c) => (e.target.checked ? [...c, v.id] : c.filter((x) => x !== v.id)))} />
              {v.name}
            </label>
          ))}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} className="w-full border rounded p-2" placeholder="Paste an AI-generated text (200+ words)" />
        <div className="flex items-center gap-3">
          <button onClick={generate} disabled={!!busy} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">Generate variants</button>
          <span className="text-neutral-500">{words(text)} words</span>
          {busy && <span className="text-neutral-700">{busy}</span>}
        </div>
        {error && <p className="text-red-600">{error}</p>}
      </section>

      {current.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">Texts to score ({current.length})</h2>
            <button onClick={() => setReveal((r) => !r)} className="rounded border px-3 py-1">{reveal ? "Hide variant names" : "Reveal variant names"}</button>
          </div>
          {current.map((it, n) => (
            <article key={it.id} className="rounded-lg border border-neutral-200 p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <b>Text {n + 1}</b>
                <span className="text-neutral-500">{it.words} words{it.commas != null ? `, ${it.commas} commas/sentence` : ""}</span>
                {reveal && <span className="rounded bg-neutral-100 px-2 py-0.5">{nameOf(it.variant)}{it.run ? ` #${it.run}` : ""}{it.model ? ` · ${it.model}` : ""}</span>}
                {!it.error && <button className="underline" onClick={() => navigator.clipboard?.writeText(it.text)}>Copy text</button>}
              </div>
              {it.error ? <p className="text-red-600">Failed: {it.error}</p> : <p className="whitespace-pre-wrap text-neutral-800 max-h-48 overflow-auto">{it.text}</p>}
              {!it.error && (
                <div className="flex flex-wrap gap-4">
                  {DETECTORS.map((d) => (
                    <label key={d} className="flex items-center gap-2">{d} % human
                      <input type="number" min={0} max={100} value={it.scores[d] ?? ""} onChange={(e) => setScore(it.id, d, e.target.value)} className="border rounded px-2 py-1 w-20" />
                    </label>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Results across all texts ({scoredCount} scored)</h2>
          <button onClick={exportCsv} className="rounded border px-3 py-1">Export CSV</button>
          <button onClick={() => { if (confirm("Delete all saved results in this browser?")) { setItems([]); setSession(""); } }} className="rounded border px-3 py-1">Clear</button>
        </div>
        {!reveal && current.length > 0 ? <p className="text-neutral-500">Reveal the variant names above to see the table.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-1 pr-3">Variant</th><th className="pr-3">Texts</th><th className="pr-3">Commas/sent</th>
                  {DETECTORS.map((d) => <th key={d} className="pr-3">{d}: median / min / ≥{TARGET}</th>)}
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.id} className="border-b">
                    <td className="py-1 pr-3">{nameOf(s.id)}</td>
                    <td className="pr-3">{s.n}</td>
                    <td className="pr-3">{f(s.commas, 2)}</td>
                    {s.perDet.map((p) => <td key={p.d} className="pr-3">{p.n ? `${f(p.med)} / ${f(p.min)} / ${p.ok}/${p.n}` : "-"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-neutral-500">A variant only counts as better if its median is higher <i>and</i> its minimum is not worse, on at least 5 different texts. Compare against the raw AI row: a rewrite that scores below the raw text is making things worse.</p>
      </section>
    </main>
  );
}

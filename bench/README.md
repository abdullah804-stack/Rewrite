# Benchmark

This is how you find out whether a change to the pipeline actually helped. Judge changes by these numbers, not by two or three manual checks.

## Why it works this way

- **Long texts (200+ words).** Most detectors are unreliable on short text. A 60-word sample can swing from 100% to 0% human with no change in the tool.
- **Repeat runs.** Each text is rewritten several times, so you can see run-to-run spread.
- **Controls.** Raw AI text and real human text go through the same detectors. If a detector gives real human text 40% human, a 60% target on that detector means nothing.
- **Model logging.** Every row records which provider and model wrote it.

## One-time setup

1. Pick a secret and set it in the server's `.env`: `BENCH_KEY=some-long-random-string`. With a matching `benchKey` in the request, the server skips its cache and quota. Without it, repeat runs return the cached text.
2. Optional: put your own writing (200+ words per file) in `bench/my-writing/*.txt`. These become extra human controls.
3. Optional: `pnpm bench:gen 20` writes `bench/corpus-extra.json`, 20 more AI-style texts, to get past 30 total.

## Each experiment

```bash
pnpm dev                                   # server running with your API keys
BENCH_KEY=some-long-random-string pnpm bench --label baseline --runs 3
# with extra texts:
BENCH_KEY=... pnpm bench --label baseline --corpus bench/corpus.json,bench/corpus-extra.json
```

This creates `bench/runs/<time>-baseline/` containing:

| File | What it is |
|---|---|
| `paste-sheet.md` | Every text to paste into your detectors, each with a key (kind, id, run) |
| `results.csv` | One row per text and run. Fill the detector columns with **% human** (0-100). If a tool reports % AI, enter 100 minus it |
| `outputs/` | The rewritten texts |
| `meta.json` | Git commit, settings, and which models were actually used |

Then analyze:

```bash
pnpm bench:analyze bench/runs/<folder>
pnpm bench:analyze bench/runs/<before> bench/runs/<after>     # side-by-side comparison
pnpm bench:analyze --target 70 bench/runs/<folder>            # change the target (default 60)
```

The "Shape" section works before you fill in any detector scores. It shows how the outputs differ from the human controls in sentence rhythm.

## Rules for fair comparison

- Change **one thing** per experiment, and give it a descriptive `--label`.
- Keep the corpus, intensity and preset the same between runs you compare.
- Score every text in the same detector the same way. Do not re-roll a result you dislike.
- Judge on the median and on the share of texts at or above the target, not on single examples.
- If the "By model" table shows different medians per model, fix the model routing before tuning prompts.

## Columns

`tell_score`, `burstiness`, `copied_bigrams`, `persona`, `stock` and `similar_runs` come from `lib/pipeline/aiTells.ts`. `short_ratio` is the share of sentences with 5 words or fewer. `long_short_pairs` counts places where a sentence of 18+ words is followed by one of 5 or fewer. The analysis reports how well each one correlates with the detectors, so you can tell which are worth optimizing.

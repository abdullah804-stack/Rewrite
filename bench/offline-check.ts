import fs from "fs";
import { analyzeText } from "../lib/pipeline/aiTells";
const ai = JSON.parse(fs.readFileSync("bench/corpus.json", "utf8"));
const hu = JSON.parse(fs.readFileSync("bench/human-samples.json", "utf8"));
const fmt = (n: number) => n.toFixed(1).padStart(5);
console.log("AI-written originals (scored against themselves, so overlap/mirror are expected high)");
for (const t of ai) {
  const r = analyzeText(t.text, "", { maxOverlap: 0.2 });
  console.log(`${t.id.padEnd(16)} sents=${String(r.sentences).padStart(2)} burst=${r.burstiness.toFixed(2)} stock=${String(r.bannedHits.length).padStart(2)} similarRuns=${r.similarRuns.length} closer=${r.summaryCloser ? "Y" : "n"}  score=${fmt(r.score)}`);
}
console.log("\nHuman-written samples, different topics (false-positive check; want low scores)");
for (const t of hu) {
  const r = analyzeText(t.text, "", { maxOverlap: 0.2 });
  console.log(`${t.id.padEnd(16)} sents=${String(r.sentences).padStart(2)} burst=${r.burstiness.toFixed(2)} stock=${String(r.bannedHits.length).padStart(2)} persona=${r.personaInserts.length} score=${fmt(r.score)}  ${r.problems.map(p => p.slice(0, 50)).join(" | ")}`);
}
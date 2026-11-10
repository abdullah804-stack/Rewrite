import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { protect } from "../lib/pipeline/protect";

const RESULTS = "eval-results";
const FIXTURES = "fixtures";

// Find the latest eval-*.json
const files = readdirSync(RESULTS)
  .filter((f) => f.startsWith("eval-") && f.endsWith(".json"))
  .sort();
const latest = join(RESULTS, files[files.length - 1]);
console.log(`Reading: ${latest}\n`);

const rows = JSON.parse(readFileSync(latest, "utf-8"));
const failures = rows.filter((r: any) => r.ok && !r.spansPreserved);

if (failures.length === 0) {
  console.log("No span failures in the latest eval. 🎉");
  process.exit(0);
}

console.log(`Found ${failures.length} span failure(s):\n`);

for (const row of failures) {
  console.log("=".repeat(70));
  console.log(`Fixture: ${row.fixture}`);
  console.log(`Provider: ${row.providerId}  Model: ${row.model}`);
  console.log(`Span detail:`, row.spanDetail);
  console.log(`Lint delta: ${row.lintDelta}, Grade delta: ${row.gradeDelta}`);
  console.log();

  // Load the original fixture to show which spans it contains
  const fixturePath = join(FIXTURES, row.fixture);
  try {
    const text = readFileSync(fixturePath, "utf-8");
    const { masked, spans } = protect(text);
    console.log(`Original word count: ${text.split(/\s+/).length}`);
    console.log(`Protected spans (${spans.length}):`);
    for (const s of spans) {
      console.log(`  ${s.token} [${s.kind}] "${s.original}"`);
    }
    console.log();
    console.log(`Masked (first 500 chars):`);
    console.log(masked.slice(0, 500).replace(/\n/g, "\\n"));
    console.log();
  } catch (err) {
    console.log(`  Could not load fixture: ${(err as Error).message}\n`);
  }
}
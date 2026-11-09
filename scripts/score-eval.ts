import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

const RESULTS = "eval-results";
const RUBRIC_DIR = "eval-results";

// Find the most recent eval-*.json file
const files = readdirSync(RESULTS)
  .filter((f) => f.startsWith("eval-") && f.endsWith(".json"))
  .sort();

if (files.length === 0) {
  console.error("No eval results found. Run scripts/eval.ts first.");
  process.exit(1);
}

const latest = join(RESULTS, files[files.length - 1]);
const rows = JSON.parse(readFileSync(latest, "utf-8"));

console.log(`Scoring ${rows.length} rows from ${latest}`);

// Build the rubric markdown
let markdown = `# Eval Results — Human Scoring Rubric\n\n`;
markdown += `Generated from: \`${latest}\`\n\n`;
markdown += `## Instructions\n\n`;
markdown += `For each row below, read the original text (in the fixture) and the rewritten output.\n`;
markdown += `Score each dimension 1–5 and fill in the blanks.\n\n`;
markdown += `- **Naturalness:** Does the rewrite sound human, not AI-ish?\n`;
markdown += `- **Clarity:** Is it clearer than the original?\n`;
markdown += `- **Meaning:** Is the original meaning preserved?\n`;
markdown += `- **Voice:** Does it match the intended voice (if applicable)?\n`;
markdown += `- **Grammar:** Is it free of grammar/spelling errors?\n\n`;
markdown += `---\n\n`;

for (const row of rows) {
  if (!row.ok) continue;

  markdown += `## ${row.fixture} — ${row.providerId}\n\n`;
  markdown += `**Model:** ${row.model}\n`;
  markdown += `**Latency:** ${row.latencyMs}ms\n`;
  markdown += `**Spans:** ${row.spansProtected} protected, ${row.spansPreserved ? "✔ preserved" : "✘ broken"}\n\n`;
  markdown += `| Dimension | Score (1-5) | Notes |\n`;
  markdown += `|---|---|---|\n`;
  markdown += `| Naturalness | _ | |\n`;
  markdown += `| Clarity | _ | |\n`;
  markdown += `| Meaning | _ | |\n`;
  markdown += `| Voice | _ | |\n`;
  markdown += `| Grammar | _ | |\n\n`;
  markdown += `---\n\n`;
}

const outFile = join(RUBRIC_DIR, `rubric-${Date.now()}.md`);
writeFileSync(outFile, markdown, "utf-8");
console.log(`Rubric written to ${outFile}`);
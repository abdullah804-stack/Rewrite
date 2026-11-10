import { readdirSync, readFileSync, unlinkSync, statSync } from "fs";
import { join } from "path";

const FIXTURES = "fixtures";
const folders = [
  "ai-drafts",
  "adversarial",
  "clean",
  "genres",
  "messy",
  "claims",
  "target-voice",
];

let deleted = 0;

for (const folder of folders) {
  const dir = join(FIXTURES, folder);
  try {
    statSync(dir);
  } catch {
    continue;
  }
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".txt")) continue;
    const path = join(dir, file);
    const content = readFileSync(path, "utf-8").trim();
    // Delete if empty or contains only the seed-fixture TODO comment
    if (
      content.length === 0 ||
      content.startsWith("<!-- TODO:") ||
      content === "Paste a real sample here."
    ) {
      unlinkSync(path);
      console.log(`  deleted: ${path}`);
      deleted++;
    }
  }
}

console.log(`\nDeleted ${deleted} empty files.`);
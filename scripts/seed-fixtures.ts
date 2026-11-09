import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const FIXTURES = "fixtures";

const FOLDERS = [
  { name: "ai-drafts", count: 30, kind: "AI-generated content" },
  { name: "clean", count: 20, kind: "Clean human writing" },
  { name: "genres", count: 20, kind: "Different writing genres" },
  { name: "target-voice", count: 15, kind: "Voice-matching samples" },
  { name: "adversarial", count: 15, kind: "Adversarial and formatting cases" },
];

for (const { name, count, kind } of FOLDERS) {
  const dir = join(FIXTURES, name);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  for (let i = 1; i <= count; i++) {
    const file = join(dir, `${String(i).padStart(2, "0")}.txt`);
    if (existsSync(file)) {
      console.log(`Skipping ${file} (already exists)`);
      continue;
    }
    writeFileSync(
      file,
      `<!-- TODO: ${kind} sample ${i} of ${count} -->\n\nPaste a real ${kind.toLowerCase()} sample here.\n`,
      "utf-8"
    );
    console.log(`Created ${file}`);
  }
}

console.log("\nAll fixture folders seeded.");
console.log("Now edit each .txt file with real content.");
console.log("Then run: npx tsx scripts/eval.ts");
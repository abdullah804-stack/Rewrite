import { writeFileSync, mkdirSync } from "fs";

const SENTENCE_POOL = [
  "The project began without a clear plan.",
  "Every attempt to simplify made it more complex.",
  "We learned that small changes compound faster than big ones.",
  "The team met weekly to discuss progress and blockers.",
  "Documentation was written after the code, not before.",
  "Edge cases were discovered in production, not in tests.",
  "The simplest solution usually won.",
  "Deadlines shifted twice before anything shipped.",
  "Feedback from real users was worth more than any roadmap.",
  "The first version did one thing well and nothing else.",
  "In hindsight, the decision looked obvious.",
  "We measured everything except what mattered.",
  "A short delay now saves a long delay later.",
  "Nobody asked for the feature that took the longest to build.",
  "The cost of maintenance was underestimated from the start.",
];

const TARGET_WORDS = 5200;

let text = "";
let words = 0;
let i = 0;

while (words < TARGET_WORDS) {
  const sentence = SENTENCE_POOL[i % SENTENCE_POOL.length];
  text += sentence + " ";
  words += sentence.split(/\s+/).length;
  i++;
  if (i % 5 === 0) text += "\n\n";
}

text = text.trim();

mkdirSync("fixtures/large", { recursive: true });
writeFileSync("fixtures/large/large.txt", text, "utf-8");

console.log(`Wrote fixtures/large/large.txt (${words} words)`);
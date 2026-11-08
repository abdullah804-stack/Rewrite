import { protect } from "./lib/pipeline/protect";

const cases = [
  "Revenue reached $50 million in 2024.",
  '"Do it or don\'t do it, you will regret both"',
  "In 2023, about 62% of firms adopted it (Smith et al., 2023).",
  "Step 01: set the value to 2048.",
];

for (const text of cases) {
  const { spans, masked } = protect(text);
  console.log("\n=== " + JSON.stringify(text) + " ===");
  console.log("spans:", spans.map((s) => ({ kind: s.kind, original: s.original, token: s.token })));
  console.log("masked:", masked);
}
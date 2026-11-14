import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { analyzeText } from "../aiTells";

const root = path.resolve(__dirname, "../../..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

describe("rewrite output is not post-processed at random", () => {
  it("the rewrite route and the AI-tell module never use Math.random", () => {
    for (const rel of ["app/api/rewrite/route.ts", "lib/pipeline/aiTells.ts"]) {
      expect(read(rel), `${rel} must stay deterministic`).not.toMatch(/Math\.random\s*\(/);
    }
  });

  it("the route returns the scored text as-is (no inject*/noise/chaos step)", () => {
    const route = read("app/api/rewrite/route.ts");
    expect(route).not.toMatch(/inject\w*\(/i);
    expect(route).toMatch(/const finalOutput = best\.restored;/);
  });

  it("analyzeText gives identical results for identical input", () => {
    const text = "Remote work changed a lot. Meetings got shorter, which helped. Hallway chat vanished. We now hold a weekly call where people just talk, and it turned out to be the best-attended thing we run.";
    const a = analyzeText(text, "");
    const b = analyzeText(text, "");
    expect(a).toEqual(b);
  });
});

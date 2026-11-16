import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "../../..");
const page = fs.readFileSync(path.join(root, "app/bench/page.tsx"), "utf8");
const route = fs.readFileSync(path.join(root, "app/api/rewrite/route.ts"), "utf8");

describe("bench workbench page", () => {
  it("only sends fields the rewrite route actually reads (the route ignores unknown fields silently)", () => {
    const variantBlock = page.slice(page.indexOf("const VARIANTS"), page.indexOf("const DETECTORS"));
    const keys = new Set([...variantBlock.matchAll(/body: \{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1])));
    expect(keys.size).toBeGreaterThan(0);
    for (const k of keys) expect(route, `route does not read "${k}"`).toMatch(new RegExp(`\\b${k}: z\\.`));
    // and the bench key is always sent, so quota and cache are skipped
    expect(page).toMatch(/benchKey: key\.trim\(\)/);
  });
  it("variant ids are unique and the control row is separate", () => {
    const ids = [...page.matchAll(/\{ id: "([\w-]+)", name:/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain("raw");
  });
  it("hides which variant is which until revealed, and shuffles the order", () => {
    expect(page).toMatch(/shuffle\(chosen\.flatMap/);
    expect(page).toMatch(/\{reveal && <span/);
  });
});

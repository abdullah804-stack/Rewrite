import { describe, expect, it } from "vitest";
import { prepareRewriteContext } from "../rewriteContext";

describe("prepareRewriteContext", () => {
  it("preserves short context after trimming outer whitespace", () => {
    expect(prepareRewriteContext("  Nearby details.  ")).toBe("Nearby details.");
  });

  it("bounds long context while retaining its beginning and ending", () => {
    const context = `START${"x".repeat(5000)}END`;
    const excerpt = prepareRewriteContext(context);

    expect(excerpt.length).toBeLessThanOrEqual(4000);
    expect(excerpt.startsWith("START")).toBe(true);
    expect(excerpt.endsWith("END")).toBe(true);
    expect(excerpt).toContain("[...]");
  });
});

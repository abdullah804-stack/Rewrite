import { describe, expect, it } from "vitest";
import { chunkText } from "../chunking";

describe("chunkText", () => {
  it("preserves trailing text when splitting a long paragraph", () => {
    const text = `${"A complete sentence. ".repeat(40)}A final thought without punctuation`;
    const chunks = chunkText(text, 20);
    const reconstructed = chunks.join(" ").replace(/\s+/g, " ").trim();

    expect(reconstructed).toBe(text.replace(/\s+/g, " ").trim());
  });

  it("keeps sentence-ending quotes and punctuation", () => {
    const text = `${'"Quoted sentence." '.repeat(40)}Final words`;
    const reconstructed = chunkText(text, 20).join(" ").replace(/\s+/g, " ").trim();

    expect(reconstructed).toBe(text.replace(/\s+/g, " ").trim());
  });
});

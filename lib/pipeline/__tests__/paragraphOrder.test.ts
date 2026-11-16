import { describe, expect, it } from "vitest";
import { orderParagraphs } from "../paragraphOrder";

describe("orderParagraphs", () => {
  it("restores source order from indexed paragraphs", () => {
    const result = orderParagraphs(
      [{ index: 1, text: "second" }, { index: 0, text: "first" }],
      2,
    );

    expect(result).toEqual({
      ok: true,
      paragraphs: [{ index: 0, text: "first" }, { index: 1, text: "second" }],
    });
  });

  it("rejects incomplete output", () => {
    expect(orderParagraphs([{ index: 0 }], 2).ok).toBe(false);
  });

  it("rejects duplicate and out-of-range paragraph indexes", () => {
    expect(orderParagraphs([{ index: 0 }, { index: 0 }], 2).ok).toBe(false);
    expect(orderParagraphs([{ index: 0 }, { index: 2 }], 2).ok).toBe(false);
    expect(orderParagraphs([{ index: -1 }, { index: 1 }], 2).ok).toBe(false);
  });
});

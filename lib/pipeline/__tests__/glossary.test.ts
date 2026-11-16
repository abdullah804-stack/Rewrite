import { describe, expect, it } from "vitest";
import { validateGlossary, type GlossaryData } from "../glossary";

const glossary: GlossaryData = {
  alwaysUse: [],
  neverUse: ["synergy"],
  keepAsIs: ["AcmeCloud"],
};

describe("validateGlossary", () => {
  it("rejects a forbidden term without matching it inside a longer word", () => {
    expect(validateGlossary("This creates synergy.", glossary).ok).toBe(false);
    expect(validateGlossary("This creates synergies.", glossary).ok).toBe(true);
    expect(validateGlossary("The synergistic result is clear.", glossary).ok).toBe(true);
  });

  it("requires configured exact terms that appear in the source", () => {
    expect(validateGlossary("We use Acme Cloud.", glossary, "We use AcmeCloud.").ok).toBe(false);
    expect(validateGlossary("We use AcmeCloud.", glossary, "We use AcmeCloud.").ok).toBe(true);
    expect(validateGlossary("We use another service.", glossary, "We use another service.").ok).toBe(true);
  });

  it("requires every source occurrence of a keep-as-is term", () => {
    expect(
      validateGlossary("AcmeCloud is useful.", glossary, "AcmeCloud and AcmeCloud are useful.").ok
    ).toBe(false);
    expect(
      validateGlossary("AcmeCloud and AcmeCloud are useful.", glossary, "AcmeCloud and AcmeCloud are useful.").ok
    ).toBe(true);
  });

  it("preserves preferred terms when they appear in the source without forcing unrelated terms", () => {
    const preferredGlossary: GlossaryData = {
      alwaysUse: ["customer success"],
      neverUse: [],
      keepAsIs: [],
    };

    expect(
      validateGlossary("The support team helps.", preferredGlossary, "The customer success team helps.").ok
    ).toBe(false);
    expect(
      validateGlossary("The customer success team helps.", preferredGlossary, "The customer success team helps.").ok
    ).toBe(true);
    expect(
      validateGlossary("The support team helps.", preferredGlossary, "The support team helps.").ok
    ).toBe(true);
  });
});

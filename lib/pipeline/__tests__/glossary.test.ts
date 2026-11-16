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
});

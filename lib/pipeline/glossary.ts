import { z } from "zod";

export const GlossaryDataSchema = z.object({
  alwaysUse: z.array(z.string()),
  neverUse: z.array(z.string()),
  keepAsIs: z.array(z.string()),
});

export type GlossaryData = z.infer<typeof GlossaryDataSchema>;

export function buildGlossaryPrompt(glossary: GlossaryData | null): string {
  if (!glossary) return "";
  
  const lines = ["", "Glossary rules (strict):"];
  let hasRules = false;
  
  if (glossary.alwaysUse.length > 0) {
    lines.push(`- You MUST use these terms where appropriate: ${glossary.alwaysUse.join(", ")}`);
    hasRules = true;
  }
  if (glossary.neverUse.length > 0) {
    lines.push(`- You MUST NEVER use these terms: ${glossary.neverUse.join(", ")}`);
    hasRules = true;
  }
  if (glossary.keepAsIs.length > 0) {
    lines.push(`- Do NOT alter, translate, or pluralize these brand names/terms: ${glossary.keepAsIs.join(", ")}`);
    hasRules = true;
  }
  
  if (!hasRules) return "";
  return lines.join("\n");
}

export function validateGlossary(
  text: string,
  glossary: GlossaryData | null,
  original = ""
): { ok: boolean; error?: string } {
  if (!glossary) return { ok: true };

  for (const term of glossary.neverUse) {
    const trimmed = term.trim();
    if (!trimmed) continue;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const termPattern = new RegExp(`(^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`, "iu");
    if (termPattern.test(text)) {
      return { ok: false, error: `Used forbidden term: "${term}"` };
    }
  }

  for (const term of glossary.keepAsIs) {
    const trimmed = term.trim();
    if (
      trimmed &&
      original.toLocaleLowerCase().includes(trimmed.toLocaleLowerCase()) &&
      !text.includes(trimmed)
    ) {
      return { ok: false, error: `Required term was changed or removed: "${term}"` };
    }
  }

  return { ok: true };
}
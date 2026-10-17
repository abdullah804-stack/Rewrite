import type { Glossary } from "../generated/prisma/client"; // Adjust import path if needed

export function buildGlossaryPrompt(glossary: Glossary | null): string {
  if (!glossary) return "";
  
  const lines = ["", "Glossary rules (strict):"];
  
  if (glossary.alwaysUse.length > 0) {
    lines.push(`- You MUST use these terms where appropriate: ${glossary.alwaysUse.join(", ")}`);
  }
  if (glossary.neverUse.length > 0) {
    lines.push(`- You MUST NEVER use these terms: ${glossary.neverUse.join(", ")}`);
  }
  if (glossary.keepAsIs.length > 0) {
    lines.push(`- Do NOT alter, translate, or pluralize these brand names/terms: ${glossary.keepAsIs.join(", ")}`);
  }
  
  return lines.join("\n");
}

export function validateGlossary(
  text: string,
  glossary: Glossary | null
): { ok: boolean; error?: string } {
  if (!glossary) return { ok: true };

  const lowerText = text.toLowerCase();

  // Check neverUse
  for (const term of glossary.neverUse) {
    if (term.trim() && lowerText.includes(term.toLowerCase())) {
      return { ok: false, error: `Used forbidden term: "${term}"` };
    }
  }

  // Note: We don't strictly enforce alwaysUse here because the AI might not
  // have a natural place to put it. We just rely on the prompt for that.

  return { ok: true };
}
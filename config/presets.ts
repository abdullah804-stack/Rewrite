export type PresetId = "human" | "humanizer" | "stealth" | "blog" | "email" | "linkedin" | "newsletter" | "custom";

export const PRESETS: Record<PresetId, { name: string; instruction: string }> = {
  human: {
    name: "Human / Conversational",
    instruction:
      "Genre: General human writing. Write like a real person explaining something to a smart friend over coffee. Be clear, direct and natural. Avoid buzzwords, corporate jargon and em dashes. Never sound like a press release or use robotic transitions.",
  },
  humanizer: {
    name: "Conversational rewrite",
    instruction:
      "Genre: natural conversational writing. Use clear, everyday language while preserving the author's meaning, qualifications, and point of view. Change phrasing only where it improves clarity or flow; do not force slang, fragments, or unnecessary restructuring.",
  },
  stealth: {
    name: "Plain-spoken",
    instruction:
      "Genre: plain-spoken writing. Be direct and approachable without adding asides, slang, or personal claims. Preserve the source's evidence, uncertainty, and intended tone.",
  },
  blog: {
    name: "Blog post",
    instruction:
      "Genre: Blog post for a general online audience. Clear, engaging and conversational. Keep paragraphs short (1-3 sentences). Avoid corporate jargon and do not force artificial hooks.",
  },
  email: {
    name: "Email",
    instruction:
      "Genre: Professional email. Be clear and concise, with the purpose obvious quickly. Scannable, natural and professional.",
  },
  linkedin: {
    name: "LinkedIn post",
    instruction:
      "Genre: LinkedIn post. Professional, insightful, career-focused. Use line breaks for readability. Avoid clickbait and formulaic scroll-stopping hooks; focus on the substance.",
  },
  newsletter: {
    name: "Newsletter",
    instruction:
      "Genre: Newsletter. Warm, personal, speaking directly to the reader. Conversational but focused and valuable.",
  },
  custom: { name: "Custom / None", instruction: "" },
};
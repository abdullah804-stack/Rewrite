export type PresetId = "human" | "humanizer" | "stealth" | "blog" | "email" | "linkedin" | "newsletter" | "custom";

export const PRESETS: Record<PresetId, { name: string; instruction: string }> = {
  human: {
    name: "Human / Conversational",
    instruction:
      "Genre: General human writing. Write like a real person explaining something to a smart friend over coffee. Be clear, direct and natural. Avoid buzzwords, corporate jargon and em dashes. Never sound like a press release or use robotic transitions.",
  },
  humanizer: {
    name: "Aggressive Humanizer",
    instruction:
      "Genre: loose, conversational first draft. Relaxed grammar is fine. Sentence lengths should be uneven, with an occasional fragment. Every sentence must be restructured; do not follow the original's order or phrasing. Choose fresh wording every time and never fall back on stock filler phrases.",
  },
  stealth: {
    name: "Stealth Mode (Anti-Detector)",
    instruction:
      "Genre: a busy, plain-spoken person typing a quick note. Direct, a little informal, small asides, no corporate or academic vocabulary. Do not force slang or profanity; let the topic decide how casual to get. Never reuse the same filler phrase twice.",
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
export type PresetId = "blog" | "email" | "linkedin" | "newsletter" | "human" | "custom";

export const PRESETS: Record<
  PresetId,
  { name: string; instruction: string }
> = {
  human: {
    name: "Human / Conversational",
    instruction:
      "Genre: General human writing. Write like a real human explaining something to a smart friend over coffee. Be professional but natural. Be clear, direct, conversational, and real. Avoid buzzwords, corporate jargon, and em dashes. Never sound like a press release. Do not use robotic transitions or overly formal vocabulary.",
  },
  blog: {
    name: "Blog post",
    instruction:
      "Genre: Blog post. Format for a general online audience. Use a clear, engaging, and conversational tone. Keep paragraphs relatively short (1-3 sentences) for easy reading. Avoid corporate jargon, but do not force artificial hooks or fragments.",
  },
  email: {
    name: "Email",
    instruction:
      "Genre: Professional email. Focus on clarity, conciseness, and immediate context. The reader should understand the purpose quickly. Keep the formatting scannable, but maintain a natural, professional tone.",
  },
  linkedin: {
    name: "LinkedIn post",
    instruction:
      "Genre: LinkedIn post. Aim for a professional, insightful tone suited to a career-focused network. Use line breaks for readability. Avoid clickbait or formulaic 'scroll-stopping' hooks; focus on the substance of the insight.",
  },
  newsletter: {
    name: "Newsletter",
    instruction:
      "Genre: Newsletter. Adopt a warm, personal tone that speaks directly to the reader. Maintain a conversational voice while keeping the content focused and valuable.",
  },
  custom: {
    name: "Custom / None",
    instruction: "",
  },
};
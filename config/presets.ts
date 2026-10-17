export type PresetId = "blog" | "email" | "linkedin" | "newsletter" | "custom";

export const PRESETS: Record<
  PresetId,
  { name: string; instruction: string }
> = {
  blog: {
    name: "Blog post",
    instruction:
      "Write in a clear, engaging, and conversational tone. Use short paragraphs (1-3 sentences). Start with a strong hook. Avoid corporate jargon.",
  },
  email: {
    name: "Email",
    instruction:
      "Write clearly and concisely. Get to the point quickly. Use a professional but friendly tone. Short paragraphs, scannable format.",
  },
  linkedin: {
    name: "LinkedIn post",
    instruction:
      "Write in a professional, insightful tone. Use short, punchy sentences. Start with a hook that stops the scroll. Use line breaks for readability.",
  },
  newsletter: {
    name: "Newsletter",
    instruction:
      "Write in a warm, personal tone. Speak directly to the reader. Use a conversational voice, but stay focused.",
  },
  custom: {
    name: "Custom / None",
    instruction: "",
  },
};
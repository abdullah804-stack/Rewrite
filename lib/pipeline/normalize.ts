export type NormalizedText = {
  original: string;
  normalized: string;
  paragraphs: string[];
};

export function normalize(input: string): NormalizedText {
  const original = input;

  const withUnixNewlines = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const collapsed = withUnixNewlines
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const paragraphs = collapsed
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return {
    original,
    normalized: collapsed,
    paragraphs,
  };
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
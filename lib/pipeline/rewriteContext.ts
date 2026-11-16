const MAX_CONTEXT_CHARS = 4000;
const OMITTED_MIDDLE = "\n[...]\n";

export function prepareRewriteContext(context: string): string {
  const trimmed = context.trim();
  if (trimmed.length <= MAX_CONTEXT_CHARS) return trimmed;

  const edgeLength = Math.floor((MAX_CONTEXT_CHARS - OMITTED_MIDDLE.length) / 2);
  return `${trimmed.slice(0, edgeLength)}${OMITTED_MIDDLE}${trimmed.slice(-edgeLength)}`;
}

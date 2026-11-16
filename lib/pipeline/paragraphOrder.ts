export type IndexedParagraph = {
  index: number;
};

export type ParagraphOrderResult<T> =
  | { ok: true; paragraphs: T[] }
  | { ok: false; error: string };

export function orderParagraphs<T extends IndexedParagraph>(
  paragraphs: T[],
  expectedCount: number,
): ParagraphOrderResult<T> {
  if (paragraphs.length !== expectedCount) {
    return {
      ok: false,
      error: `Expected ${expectedCount} paragraphs but received ${paragraphs.length}.`,
    };
  }

  const ordered: Array<T | undefined> = new Array(expectedCount);
  for (const paragraph of paragraphs) {
    if (paragraph.index < 0 || paragraph.index >= expectedCount) {
      return { ok: false, error: `Paragraph index ${paragraph.index} is out of range.` };
    }
    if (ordered[paragraph.index]) {
      return { ok: false, error: `Paragraph index ${paragraph.index} appears more than once.` };
    }
    ordered[paragraph.index] = paragraph;
  }

  const result: T[] = [];
  for (let index = 0; index < expectedCount; index++) {
    const paragraph = ordered[index];
    if (!paragraph) {
      return { ok: false, error: `Paragraph index ${index} is missing.` };
    }
    result.push(paragraph);
  }

  return { ok: true, paragraphs: result };
}

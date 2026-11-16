function splitSentences(text: string): string[] {
  return (text.match(/[\s\S]+?(?:[.!?]+(?:["')\]]*)?(?=\s|$)|$)/g) ?? [text])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function chunkText(text: string, maxWords = 800): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWords = 0;

  const flush = () => {
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join("\n\n"));
      currentChunk = [];
      currentWords = 0;
    }
  };

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).length;

    if (words > maxWords) {
      flush();

      let sentenceChunk: string[] = [];
      let sentenceWords = 0;
      for (const sentence of splitSentences(paragraph)) {
        const sentenceWordCount = sentence.split(/\s+/).length;
        if (sentenceWords + sentenceWordCount > maxWords && sentenceChunk.length > 0) {
          chunks.push(sentenceChunk.join(" "));
          sentenceChunk = [];
          sentenceWords = 0;
        }
        sentenceChunk.push(sentence);
        sentenceWords += sentenceWordCount;
      }

      if (sentenceChunk.length > 0) chunks.push(sentenceChunk.join(" "));
      continue;
    }

    if (currentWords + words > maxWords && currentChunk.length > 0) flush();
    currentChunk.push(paragraph);
    currentWords += words;
  }

  flush();
  return chunks;
}

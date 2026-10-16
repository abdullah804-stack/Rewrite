export type ParsedFile = {
  text: string;
  filename: string;
  kind: "txt" | "md" | "docx" | "pdf";
};

function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^>\s+/gm, "")
    .trim();
}

function extension(name: string): string {
  const lower = name.toLowerCase();
  const idx = lower.lastIndexOf(".");
  return idx === -1 ? "" : lower.slice(idx + 1);
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const ext = extension(file.name);

  if (ext === "txt") {
    const text = await file.text();
    return { text: text.trim(), filename: file.name, kind: "txt" };
  }

  if (ext === "md" || ext === "markdown") {
    const raw = await file.text();
    return { text: stripMarkdown(raw), filename: file.name, kind: "md" };
  }

  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return {
      text: result.value.trim(),
      filename: file.name,
      kind: "docx",
    };
  }

  if (ext === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    // Point the worker at the matching version from the CDN
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      text += strings + "\n\n";
    }

    return {
      text: text.trim(),
      filename: file.name,
      kind: "pdf",
    };
  }

  throw new Error(`Unsupported file type: .${ext}`);
}

export const ACCEPTED_EXTENSIONS = ".txt,.md,.markdown,.docx,.pdf";
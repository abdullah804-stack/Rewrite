import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";

export type ExportFormat = "txt" | "md" | "html" | "docx";

function safeFilename(title: string, ext: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "rewrite"}.${ext}`;
}

export function exportAsTxt(text: string, title: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  saveAs(blob, safeFilename(title, "txt"));
}

export function exportAsMarkdown(text: string, title: string): void {
  // Plain text already is valid markdown, but we add a title header
  const md = `# ${title}\n\n${text}\n`;
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  saveAs(blob, safeFilename(title, "md"));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function exportAsHtml(text: string, title: string): void {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; color: #0a0a0a; line-height: 1.6; }
  h1 { font-size: 24px; font-weight: 600; }
  p { margin: 1em 0; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
${paragraphs}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  saveAs(blob, safeFilename(title, "html"));
}

export async function exportAsDocx(
  text: string,
  title: string
): Promise<void> {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const children: Paragraph[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
    }),
  ];

  for (const para of paragraphs) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: para })],
      })
    );
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, safeFilename(title, "docx"));
}

export async function exportAs(
  format: ExportFormat,
  text: string,
  title: string
): Promise<void> {
  switch (format) {
    case "txt":
      exportAsTxt(text, title);
      return;
    case "md":
      exportAsMarkdown(text, title);
      return;
    case "html":
      exportAsHtml(text, title);
      return;
    case "docx":
      await exportAsDocx(text, title);
      return;
  }
}
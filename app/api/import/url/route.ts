import { NextResponse } from "next/server";
import { lookup } from "dns/promises";
import { isIP } from "net";

export const runtime = "nodejs";
export const maxDuration = 15;

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
]);

function isPrivateIp(ip: string): boolean {
  // IPv4
  if (isIP(ip) === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }
  // IPv6
  if (isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("fe80")) return true;
    return false;
  }
  return true;
}

async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Not a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed.");
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("That host is not allowed.");
  }

  // Resolve DNS and check every returned address
  const addresses = await lookup(hostname, { all: true });
  for (const addr of addresses) {
    if (isPrivateIp(addr.address)) {
      throw new Error("That host resolves to a private address.");
    }
  }

  return url;
}

function extractTextFromHtml(html: string): string {
  let body = html;

  // Strip script, style, head
  body = body.replace(/<script[\s\S]*?<\/script>/gi, " ");
  body = body.replace(/<style[\s\S]*?<\/style>/gi, " ");
  body = body.replace(/<head[\s\S]*?<\/head>/gi, " ");
  body = body.replace(/<nav[\s\S]*?<\/nav>/gi, " ");
  body = body.replace(/<footer[\s\S]*?<\/footer>/gi, " ");
  body = body.replace(/<header[\s\S]*?<\/header>/gi, " ");

  // Try to isolate <article> or <main> if present
  const articleMatch = body.match(/<article[\s\S]*?<\/article>/i);
  const mainMatch = body.match(/<main[\s\S]*?<\/main>/i);
  if (articleMatch) body = articleMatch[0];
  else if (mainMatch) body = mainMatch[0];

  // Replace block tags with newlines, then strip everything else
  body = body.replace(
    /<\/(p|div|h[1-6]|li|tr|blockquote|pre|section|article)>/gi,
    "\n\n"
  );
  body = body.replace(/<br\s*\/?>/gi, "\n");
  body = body.replace(/<[^>]+>/g, " ");

  // Decode the most common entities
  body = body
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 10))
    );

  // Collapse whitespace
  body = body
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return body;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawUrl = (body?.url ?? "").toString().trim();

    if (!rawUrl) {
      return NextResponse.json(
        { ok: false, error: "URL is required." },
        { status: 400 }
      );
    }

    let url: URL;
    try {
      url = await assertPublicUrl(rawUrl);
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: (err as Error).message },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; RewriteBot/1.0; +https://rewrite.app)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `The site returned ${response.status}.`,
        },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain")
    ) {
      return NextResponse.json(
        { ok: false, error: "That URL is not a text or HTML page." },
        { status: 415 }
      );
    }

    const buffer = await response.arrayBuffer();
    // Cap at ~2 MB to prevent abuse
    if (buffer.byteLength > 2 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "The page is too large to import." },
        { status: 413 }
      );
    }

    const decoder = new TextDecoder("utf-8");
    const raw = decoder.decode(buffer);

    const text = contentType.includes("text/plain")
      ? raw.trim()
      : extractTextFromHtml(raw);

    if (text.length < 20) {
      return NextResponse.json(
        { ok: false, error: "No readable text was found on that page." },
        { status: 422 }
      );
    }

    return NextResponse.json({ ok: true, text });
  } catch (err) {
    const message = (err as Error).name === "AbortError"
      ? "The request timed out."
      : (err as Error).message;
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
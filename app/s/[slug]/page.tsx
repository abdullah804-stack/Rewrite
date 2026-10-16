import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = await prisma.document.findFirst({
    where: { slug, isPublic: true },
  });

  if (!doc) return { title: "Not found" };

  return {
    title: doc.title,
    robots: { index: false, follow: false },
  };
}

export default async function SharedDocumentPage({ params }: PageProps) {
  const { slug } = await params;

  const doc = await prisma.document.findFirst({
    where: { slug, isPublic: true },
    include: {
      revisions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!doc) notFound();

  // Show the most recent REWRITE revision (or the ORIGINAL if no rewrite)
  const rewrite = doc.revisions.find((r) => r.kind === "REWRITE");
  const original = doc.revisions.find((r) => r.kind === "ORIGINAL");
  const content = rewrite?.content ?? original?.content ?? "";

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-black">
            Rewrite
          </Link>
          <Link
            href="/quick"
            className="text-sm text-neutral-500 hover:text-black transition-colors"
          >
            Try the tool
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-semibold text-black">
          {doc.title}
        </h1>
        <p className="text-xs text-neutral-400 mt-2">
          Shared {new Date(doc.updatedAt).toLocaleDateString()} · read-only
        </p>

        <div className="mt-8 text-base text-black whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      </article>

      <footer className="border-t border-neutral-200 mt-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-neutral-400">
            Shared with Rewrite — a free writing workspace.
          </span>
          <Link
            href="/quick"
            className="text-xs text-neutral-500 hover:text-black transition-colors"
          >
            Make your own →
          </Link>
        </div>
      </footer>
    </main>
  );
}
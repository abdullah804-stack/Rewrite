import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ReviewClient } from "./ReviewClient";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = await prisma.document.findFirst({ where: { slug, isPublic: true } });
  if (!doc) return { title: "Not found" };
  return { title: doc.title, robots: { index: false, follow: false } };
}

export default async function SharedDocumentPage({ params }: PageProps) {
  const { slug } = await params;

  const doc = await prisma.document.findFirst({
    where: { slug, isPublic: true },
    include: {
      revisions: { orderBy: { createdAt: "desc" } },
      comments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!doc) notFound();

  const rewrite = doc.revisions.find((r) => r.kind === "REWRITE");
  const original = doc.revisions.find((r) => r.kind === "ORIGINAL");
  
  const originalText = original?.content ?? "";
  const rewrittenText = rewrite?.content ?? "";

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 text-black dark:text-white transition-colors">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-black dark:text-white">
            Rewrite
          </Link>
          <Link href="/quick" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
            Try the tool
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-black dark:text-white">
            {doc.title}
          </h1>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
            Shared {new Date(doc.updatedAt).toLocaleDateString()} · Review mode
          </p>
        </div>

        <ReviewClient 
          slug={doc.slug!} 
          original={originalText} 
          rewritten={rewrittenText} 
          initialComments={doc.comments} 
        />
      </div>
    </main>
  );
}
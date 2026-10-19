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
    <main className="min-h-screen bg-surface-base dark:bg-surface-dark-base text-text-primary dark:text-text-dark-primary transition-colors">
      <header className="border-b border-surface-border dark:border-surface-dark-border sticky top-0 bg-surface-base/80 dark:bg-surface-dark-base/80 backdrop-blur-md z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
              R
            </div>
            Rewrite
          </Link>
          <Link href="/quick" className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
            Try the tool
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 text-brand-700 dark:text-brand-500 text-xs font-bold tracking-wide uppercase mb-4 shadow-sm">
            Review Mode
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary dark:text-white tracking-tight">
            {doc.title}
          </h1>
          <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary mt-2">
            Shared on {new Date(doc.updatedAt).toLocaleDateString()}
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
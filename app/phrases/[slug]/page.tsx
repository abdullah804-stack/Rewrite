import Link from "next/link";
import { notFound } from "next/navigation";
import { phrases } from "@/lib/phrases";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function generateStaticParams() {
  return phrases.map((p) => ({
    slug: slugify(p.phrase),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const phrase = phrases.find((p) => slugify(p.phrase) === slug);
  if (!phrase) return { title: "Not found" };

  return {
    title: `Stop saying "${phrase.phrase}"`,
    description: `Why "${phrase.phrase}" makes your writing sound like AI, and what to use instead.`,
  };
}

export default async function PhrasePage({ params }: PageProps) {
  const { slug } = await params;
  const phrase = phrases.find((p) => slugify(p.phrase) === slug);

  if (!phrase) notFound();

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-black">
            Rewrite
          </Link>
          <Link href="/phrases" className="text-sm text-neutral-500 hover:text-black transition-colors">
            All phrases
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            {phrase.category.replace("-", " ")}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-black mb-6">
          Stop saying &quot;{phrase.phrase}&quot;
        </h1>

        <div className="prose prose-neutral prose-sm sm:prose-base max-w-none text-neutral-600">
          <p className="text-lg text-black leading-relaxed mb-8">
            {phrase.notes}
          </p>

          {phrase.replacements.length > 0 && phrase.replacements[0] !== "" && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 mb-8">
              <h3 className="text-sm font-medium text-black uppercase tracking-wide mt-0 mb-3">
                What to use instead
              </h3>
              <div className="flex flex-wrap gap-2">
                {phrase.replacements.map((r) => (
                  <span key={r} className="px-3 py-1 bg-white border border-neutral-200 rounded-md text-sm font-medium text-black">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {phrase.replacements.length > 0 && phrase.replacements[0] === "" && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 mb-8">
              <h3 className="text-sm font-medium text-black uppercase tracking-wide mt-0 mb-3">
                What to do
              </h3>
              <p className="text-sm font-medium text-black m-0">
                Delete it. The sentence is almost always stronger without it.
              </p>
            </div>
          )}

          <h3>Why it sounds like AI</h3>
          <p>
            Phrases like this are statistically overrepresented in AI-generated text. 
            They act as structural filler—they pad the word count without adding meaning. 
            Human writers usually prefer a direct statement over a winding preamble.
          </p>

          <h3>See it in action</h3>
          <p>
            Paste a draft with this phrase into our free tool to see exactly how it gets fixed.
          </p>
        </div>

        <div className="mt-10">
          <Link
            href="/quick"
            className="inline-block h-11 px-6 rounded-lg bg-black text-white text-sm font-medium leading-[44px] hover:bg-neutral-800 transition-colors"
          >
            Fix your draft now
          </Link>
        </div>
      </div>
    </main>
  );
}
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
    <main className="min-h-screen bg-surface-base text-text-primary transition-colors">
      <header className="border-b border-surface-border sticky top-0 bg-surface-base/90 backdrop-blur-md z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs sm:text-sm font-black shadow-sm">
              R
            </div>
            <span className="hidden sm:inline">Rewrite</span>
          </Link>
          <Link href="/phrases" className="text-xs sm:text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors">
            All phrases
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-20">
        <div className="mb-3 sm:mb-4">
          <Link href="/phrases" className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1">
            ← Back to dictionary
          </Link>
        </div>
        
        <h1 className="text-2xl sm:text-5xl font-extrabold text-text-primary tracking-tight mb-6 sm:mb-12">
          Stop saying &quot;{phrase.phrase}&quot;
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-6 sm:mt-12">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6 sm:space-y-8">
            <div className="prose prose-neutral max-w-none text-text-secondary leading-relaxed">
              <p className="text-base sm:text-xl text-text-primary font-medium mb-6 sm:mb-8">
                {phrase.notes}
              </p>

              <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3">Why it sounds like AI</h3>
              <p className="text-sm sm:text-base">
                Phrases like this are statistically overrepresented in AI-generated text. 
                They act as structural filler—they pad the word count without adding meaning. 
                Human writers usually prefer a direct statement over a winding preamble.
              </p>

              <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3 mt-6 sm:mt-8">See it in action</h3>
              <p className="text-sm sm:text-base">
                Paste a draft with this phrase into our free tool to see exactly how it gets flagged and fixed.
              </p>
            </div>

            <div className="pt-4 sm:pt-6">
              <Link
                href="/quick"
                className="inline-block h-11 sm:h-12 px-6 sm:px-8 rounded-xl bg-brand-600 text-white text-sm sm:text-base font-semibold leading-[44px] sm:leading-[48px] hover:bg-brand-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Fix your draft now
              </Link>
            </div>
          </div>

          {/* Sidebar Card */}
          <div>
            <div className="p-5 sm:p-6 rounded-2xl bg-surface-raised border border-surface-border shadow-sm md:sticky md:top-24">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-text-secondary mb-3 sm:mb-4">Details</div>
              
              <div className="mb-4 sm:mb-6">
                <span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-brand-50 text-brand-700 text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                  {phrase.category.replace("-", " ")}
                </span>
              </div>

              {phrase.replacements.length > 0 && phrase.replacements[0] !== "" && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-xs sm:text-sm font-bold text-text-primary mb-2">Use instead:</h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {phrase.replacements.map((r) => (
                      <span key={r} className="px-2 py-1 sm:px-2.5 sm:py-1 bg-surface-base border border-surface-border rounded-md text-xs sm:text-sm font-medium text-text-primary">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {phrase.replacements.length > 0 && phrase.replacements[0] === "" && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-xs sm:text-sm font-bold text-text-primary mb-2">Recommendation:</h4>
                  <p className="text-xs sm:text-sm font-medium text-brand-600">
                    Delete it. The sentence is almost always stronger without it.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
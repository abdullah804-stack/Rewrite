import Link from "next/link";
import { phrases, phraseCategories } from "@/lib/phrases";
import { Logo } from "../Logo";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function PhrasesIndexPage() {
  const grouped = phrases.reduce((acc, phrase) => {
    if (!acc[phrase.category]) acc[phrase.category] = [];
    acc[phrase.category].push(phrase);
    return acc;
  }, {} as Record<string, typeof phrases>);

  return (
    <main className="min-h-screen bg-surface-base text-text-primary transition-colors">
      <header className="border-b border-surface-border sticky top-0 bg-surface-base/90 backdrop-blur-md z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Logo />
          <Link href="/quick" className="text-xs sm:text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors">
            Quick rewrite
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-20">
        <div className="max-w-3xl mb-10 sm:mb-16">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-3 sm:mb-4">
            AI Phrases to Avoid
          </h1>
          <p className="text-sm sm:text-lg text-text-secondary leading-relaxed">
            A dictionary of stock phrases, corporate jargon, and LLM tells that make your writing sound generic. Click any phrase to see why it's flagged and what to use instead.
          </p>
        </div>

        <div className="space-y-10 sm:space-y-16">
          {Object.entries(grouped).map(([category, list]) => (
            <div key={category}>
              <h2 className="text-lg sm:text-2xl font-bold text-text-primary mb-3 sm:mb-6 border-b border-surface-border pb-2 sm:pb-3">
                {phraseCategories[category as keyof typeof phraseCategories] || category.replace("-", " ")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                {list.map((p) => (
                  <Link
                    key={p.phrase}
                    href={`/phrases/${slugify(p.phrase)}`}
                    className="group p-3 sm:p-4 rounded-lg sm:rounded-xl border border-surface-border bg-surface-raised hover:border-brand-500 transition-all hover:-translate-y-1 hover:shadow-lg flex items-center justify-between gap-2 sm:gap-3"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-text-primary group-hover:text-brand-600 transition-colors truncate">
                      {p.phrase}
                    </span>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-text-secondary group-hover:text-brand-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
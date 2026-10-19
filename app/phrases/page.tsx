import Link from "next/link";
import { phrases, phraseCategories } from "@/lib/phrases";

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
    <main className="min-h-screen bg-surface-base dark:bg-surface-dark-base text-text-primary dark:text-text-dark-primary transition-colors">
      <header className="border-b border-surface-border dark:border-surface-dark-border sticky top-0 bg-surface-base/80 dark:bg-surface-dark-base/80 backdrop-blur-md z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
              R
            </div>
            Rewrite
          </Link>
          <Link href="/quick" className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-brand-600 dark:hover:text-brand-500 transition-colors">
            Quick rewrite
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-text-primary dark:text-white mb-4">
            AI Phrases to Avoid
          </h1>
          <p className="text-lg text-text-secondary dark:text-text-dark-secondary leading-relaxed">
            A dictionary of stock phrases, corporate jargon, and LLM tells that make your writing sound generic. Click any phrase to see why it's flagged and what to use instead.
          </p>
        </div>

        <div className="space-y-16">
          {Object.entries(grouped).map(([category, list]) => (
            <div key={category}>
              <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-6 border-b border-surface-border dark:border-surface-dark-border pb-3">
                {phraseCategories[category as keyof typeof phraseCategories] || category.replace("-", " ")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {list.map((p) => (
                  <Link
                    key={p.phrase}
                    href={`/phrases/${slugify(p.phrase)}`}
                    className="group p-4 rounded-xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised hover:border-brand-500 dark:hover:border-brand-500 transition-all hover:-translate-y-1 hover:shadow-lg flex items-center justify-between gap-3"
                  >
                    <span className="text-sm font-semibold text-text-primary dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-500 transition-colors truncate">
                      {p.phrase}
                    </span>
                    <svg className="w-4 h-4 text-text-secondary dark:text-text-dark-secondary group-hover:text-brand-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
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
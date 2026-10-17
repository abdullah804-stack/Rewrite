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
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-black">
            Rewrite
          </Link>
          <Link href="/quick" className="text-sm text-neutral-500 hover:text-black transition-colors">
            Quick rewrite
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-semibold text-black mb-4">
          AI Phrases to Avoid
        </h1>
        <p className="text-base text-neutral-500 mb-12 max-w-xl">
          A dictionary of stock phrases, corporate jargon, and LLM tells that make your writing sound generic.
        </p>

        <div className="space-y-12">
          {Object.entries(grouped).map(([category, list]) => (
            <div key={category}>
              <h2 className="text-lg font-medium text-black mb-4 capitalize border-b border-neutral-200 pb-2">
                {phraseCategories[category as keyof typeof phraseCategories] || category.replace("-", " ")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {list.map((p) => (
                  <Link
                    key={p.phrase}
                    href={`/phrases/${slugify(p.phrase)}`}
                    className="text-sm text-neutral-600 hover:text-black hover:underline truncate"
                  >
                    {p.phrase}
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
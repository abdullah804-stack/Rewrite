import Link from "next/link";

const EXAMPLES = [
  {
    before: "In today's fast-paced digital landscape, it is important to note that leveraging AI can revolutionize your workflow.",
    after: "AI can change how you work.",
    reason: "Removed 3 stock phrases and 1 hedge. Changed grade from 16 to 2.",
  },
  {
    before: "At the end of the day, we must delve into the nuances of this paradigm shift to unlock actionable insights.",
    after: "We need to look closely at this change to find useful ideas.",
    reason: "Removed corporate jargon and the 'delve into' tell.",
  },
  {
    before: "Studies show that 73% of users prefer a seamless experience, which is a game changer for retention.",
    after: "Studies show that 73% of users prefer a smooth experience, which matters for retention.",
    reason: "Protected the '73%' claim, removed 'seamless' and 'game changer'.",
  }
];

export default function ExamplesPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-black">
            Rewrite
          </Link>
          <Link href="/quick" className="text-sm text-neutral-500 hover:text-black transition-colors">
            Try it yourself
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-semibold text-black mb-4">
          Before & After
        </h1>
        <p className="text-base text-neutral-500 mb-12 max-w-xl">
          See how deterministic validation and AI rewriting combine to fix generic drafts.
        </p>

        <div className="space-y-8">
          {EXAMPLES.map((ex, i) => (
            <div key={i} className="rounded-lg border border-neutral-200 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
                <div className="p-6 bg-red-50/30">
                  <div className="text-xs font-medium text-red-800 uppercase tracking-wide mb-2">Before (AI-generated)</div>
                  <p className="text-sm text-neutral-600 line-through decoration-red-300">{ex.before}</p>
                </div>
                <div className="p-6 bg-green-50/30">
                  <div className="text-xs font-medium text-green-800 uppercase tracking-wide mb-2">After (Rewrite)</div>
                  <p className="text-sm text-black font-medium">{ex.after}</p>
                </div>
              </div>
              <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-500">
                {ex.reason}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/quick"
            className="inline-block h-11 px-8 rounded-lg bg-black text-white text-sm font-medium leading-[44px] hover:bg-neutral-800 transition-colors"
          >
            Try it on your own text
          </Link>
        </div>
      </div>
    </main>
  );
}
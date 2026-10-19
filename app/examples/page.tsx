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
  },
  {
    before: "It is worth noting that 42% of professionals utilize robust frameworks to facilitate seamless integration.",
    after: "42% of professionals use strong frameworks to integrate smoothly.",
    reason: "Removed 'It is worth noting', 'utilize', 'robust', and 'seamless'.",
  }
];

export default function ExamplesPage() {
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
            Try it yourself
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-text-primary dark:text-white mb-4">
            Before & After
          </h1>
          <p className="text-lg text-text-secondary dark:text-text-dark-secondary leading-relaxed">
            See how deterministic validation and AI rewriting combine to fix generic drafts. We strip away the fluff without losing your facts.
          </p>
        </div>

        <div className="space-y-10">
          {EXAMPLES.map((ex, i) => (
            <div key={i} className="rounded-3xl border border-surface-border dark:border-surface-dark-border overflow-hidden shadow-sm bg-surface-base dark:bg-surface-dark-base">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-surface-border dark:divide-surface-dark-border">
                
                {/* Before Panel */}
                <div className="p-8 bg-surface-raised dark:bg-surface-dark-raised relative">
                  <div className="absolute top-0 left-0 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-bold px-3 py-1 rounded-br-lg uppercase tracking-widest">
                    AI Draft
                  </div>
                  <p className="text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed mt-4">
                    <span className="line-through decoration-red-300 dark:decoration-red-700/50">{ex.before}</span>
                  </p>
                </div>

                {/* After Panel */}
                <div className="p-8 relative">
                  <div className="absolute top-0 left-0 bg-brand-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-lg uppercase tracking-widest">
                    Rewritten
                  </div>
                  <p className="text-base text-text-primary dark:text-white font-medium leading-relaxed mt-4">
                    {ex.after}
                  </p>
                </div>

              </div>
              <div className="px-8 py-4 bg-surface-base dark:bg-surface-dark-base border-t border-surface-border dark:border-surface-dark-border flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
                  {ex.reason}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link
            href="/quick"
            className="inline-block h-14 px-10 rounded-xl bg-brand-600 text-white text-lg font-semibold leading-[56px] hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Try it on your own text
          </Link>
        </div>
      </div>
    </main>
  );
}
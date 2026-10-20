import Link from "next/link";
import { Logo } from "../Logo";

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
    <main className="min-h-screen bg-surface-base text-text-primary transition-colors">
      <header className="border-b border-surface-border sticky top-0 bg-surface-base/90 backdrop-blur-md z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Logo />
          <Link href="/quick" className="text-xs sm:text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors">
            Try it yourself
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-20">
        <div className="max-w-3xl mb-10 sm:mb-16">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-3 sm:mb-4">
            Before & After
          </h1>
          <p className="text-sm sm:text-lg text-text-secondary leading-relaxed">
            See how deterministic validation and AI rewriting combine to fix generic drafts. We strip away the fluff without losing your facts.
          </p>
        </div>

        <div className="space-y-6 sm:space-y-10">
          {EXAMPLES.map((ex, i) => (
            <div key={i} className="rounded-2xl sm:rounded-3xl border border-surface-border overflow-hidden shadow-sm bg-surface-base">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-surface-border">
                
                {/* Before Panel */}
                <div className="p-5 sm:p-8 bg-surface-raised relative">
                  <div className="absolute top-0 left-0 bg-red-100 text-red-700 text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 rounded-br-lg uppercase tracking-widest">
                    AI Draft
                  </div>
                  <p className="text-sm sm:text-base text-text-secondary leading-relaxed mt-4">
                    <span className="line-through decoration-red-300">{ex.before}</span>
                  </p>
                </div>

                {/* After Panel */}
                <div className="p-5 sm:p-8 relative">
                  <div className="absolute top-0 left-0 bg-brand-500 text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 rounded-br-lg uppercase tracking-widest">
                    Rewritten
                  </div>
                  <p className="text-sm sm:text-base text-text-primary font-medium leading-relaxed mt-4">
                    {ex.after}
                  </p>
                </div>

              </div>
              <div className="px-5 sm:px-8 py-3 sm:py-4 bg-surface-base border-t border-surface-border flex items-start gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div className="text-xs sm:text-sm font-medium text-text-secondary">
                  {ex.reason}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 sm:mt-20 text-center">
          <Link
            href="/quick"
            className="inline-block h-12 sm:h-14 px-6 sm:px-10 rounded-xl bg-brand-600 text-white text-base sm:text-lg font-semibold leading-[48px] sm:leading-[56px] hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Try it on your own text
          </Link>
        </div>
      </div>
    </main>
  );
}
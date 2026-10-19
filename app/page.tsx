import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-surface-base dark:bg-surface-dark-base text-text-primary dark:text-text-dark-primary selection:bg-brand-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-surface-border dark:border-surface-dark-border sticky top-0 bg-surface-base/80 dark:bg-surface-dark-base/80 backdrop-blur-md z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-text-primary dark:bg-white text-surface-base dark:text-black flex items-center justify-center text-xs font-black">
              R
            </div>
            Rewrite
          </Link>
          <nav className="flex items-center gap-4 sm:gap-8">
            <Link
              href="/tools"
              className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-white transition-colors"
            >
              Free tools
            </Link>
            <Link
              href="/examples"
              className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-white transition-colors hidden sm:inline"
            >
              Examples
            </Link>
            {session?.user ? (
              <Link
                href="/dashboard"
                className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium bg-text-primary dark:bg-white text-surface-base dark:text-black px-4 py-2 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-sm"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 text-brand-700 dark:text-brand-500 text-xs font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>
            Now supporting Long-Form documents (5,000 words)
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-text-primary dark:text-white leading-[1.1] tracking-tight">
            Make AI drafts sound
            <br />
            like <span className="text-brand-600">you</span> wrote them.
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary dark:text-text-dark-secondary mt-6 max-w-2xl leading-relaxed">
            Paste a ChatGPT or Claude draft. Get it back in natural language,
            in your own voice, with every number, URL, and quote mathematically protected.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <Link
              href="/quick"
              className="h-12 px-8 rounded-xl bg-brand-600 text-white text-base font-medium leading-[48px] text-center hover:bg-brand-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              Start writing
            </Link>
            {!session?.user && (
              <Link
                href="/tools"
                className="h-12 px-8 rounded-xl border border-surface-border dark:border-surface-dark-border bg-surface-base dark:bg-surface-dark-raised text-text-primary dark:text-white text-base font-medium leading-[46px] text-center hover:bg-surface-raised dark:hover:bg-surface-dark-border transition-colors"
              >
                Try the free tools
              </Link>
            )}
          </div>
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            No account needed for short drafts.
          </p>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="border-t border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-white text-center mb-16">
            Built for serious writers.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
            <div className="p-6 rounded-2xl bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary dark:text-white">Facts protected</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-2 leading-relaxed">
                Every number, URL, and quote is tokenized before the AI sees it. The model literally cannot change your facts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary dark:text-white">Your voice, not generic</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-2 leading-relaxed">
                Teach it your own writing once. Our Voice Coach analyzes your metrics, and every future rewrite targets them.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary dark:text-white">Long-form mode</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-2 leading-relaxed">
                Paste up to 5,000 words. We automatically chunk your document, process it sequentially, and show a progress bar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border dark:border-surface-dark-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-text-primary dark:bg-white text-surface-base dark:text-black flex items-center justify-center text-[10px] font-black">
              R
            </div>
            <span className="text-sm font-medium text-text-primary dark:text-white">Rewrite</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-secondary dark:text-text-dark-secondary">
            <Link href="/tools" className="hover:text-text-primary dark:hover:text-white transition-colors">Tools</Link>
            <Link href="/examples" className="hover:text-text-primary dark:hover:text-white transition-colors">Examples</Link>
            <Link href="/phrases" className="hover:text-text-primary dark:hover:text-white transition-colors">Dictionary</Link>
            <Link href="/terms" className="hover:text-text-primary dark:hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-text-primary dark:hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
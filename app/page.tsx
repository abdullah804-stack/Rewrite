import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-black">
            Rewrite
          </Link>
          <nav className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/tools"
              className="text-sm text-neutral-500 hover:text-black transition-colors"
            >
              Free tools
            </Link>
            {session?.user ? (
              <Link
                href="/dashboard"
                className="text-sm text-neutral-500 hover:text-black transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm text-neutral-500 hover:text-black transition-colors"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-20">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-semibold text-black leading-tight tracking-tight">
            Make AI drafts sound
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>like you wrote them.
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 mt-5 sm:mt-6 max-w-xl leading-relaxed">
            Paste a ChatGPT or Claude draft. Get it back in natural language,
            in your own voice, with every number, URL, and quote protected.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href="/quick"
              className="h-11 px-6 rounded-lg bg-black text-white text-sm font-medium leading-[44px] text-center hover:bg-neutral-800 transition-colors"
            >
              Quick rewrite
            </Link>
            {!session?.user && (
              <Link
                href="/login"
                className="h-11 px-6 rounded-lg border border-neutral-200 text-black text-sm font-medium leading-[44px] text-center hover:bg-neutral-50 transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>

          <p className="text-xs text-neutral-400 mt-4">
            No account needed for the free tools. Runs in your browser.
          </p>
        </div>
      </section>

      {/* What it does */}
      <section className="border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-xl sm:text-2xl font-semibold text-black">
            Three things, done well
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 mt-10">
            <div>
              <div className="text-sm font-medium text-black">
                Natural rewrites
              </div>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                Paste any AI-assisted draft and get a version that reads like a
                person wrote it. No stock phrases, no uniform rhythm, no
                hedging.
              </p>
            </div>
            <div>
              <div className="text-sm font-medium text-black">
                Your voice, not generic
              </div>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                Teach it your own writing once, then rewrite every draft to
                match it. Your rhythm, your vocabulary, your level of
                formality.
              </p>
            </div>
            <div>
              <div className="text-sm font-medium text-black">
                Facts protected
              </div>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                Every number, URL, quote, and citation is tokenized before the
                AI sees it, then restored after. The model literally cannot
                change your facts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Free tools strip */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-black">
                Free tools, no AI, unlimited
              </h2>
              <p className="text-sm text-neutral-500 mt-2 max-w-xl">
                Everything below runs in your browser. No account, no AI calls,
                no cost, no limits.
              </p>
            </div>
            <Link
              href="/tools"
              className="text-sm font-medium text-black hover:underline whitespace-nowrap"
            >
              Open the tools →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="p-4 rounded-lg border border-neutral-200 bg-white">
              <div className="text-sm font-medium text-black">AI-ism lint</div>
              <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                Highlights stock phrases, hedges, corporate jargon, and LLM
                tells. One-click fixes.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-neutral-200 bg-white">
              <div className="text-sm font-medium text-black">
                Claim flagger
              </div>
              <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                Surfaces statistics, dates, and study claims that lack a
                nearby source. Flags what to check.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-neutral-200 bg-white">
              <div className="text-sm font-medium text-black">Readability</div>
              <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                Grade level, audience targets, long sentences, wordy phrases,
                passive voice hints.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-neutral-200 bg-white">
              <div className="text-sm font-medium text-black">Style meter</div>
              <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                Live metrics as you write. Sentence variety, contractions,
                reading grade.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Honest section */}
      <section className="border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-xl sm:text-2xl font-semibold text-black">
            What this is not
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 mt-8">
            <div>
              <div className="text-sm font-medium text-black">
                Not a detector bypasser
              </div>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                We don&apos;t promise to beat AI detectors. Detector scores are
                unreliable and changing them is not what this tool is for.
              </p>
            </div>
            <div>
              <div className="text-sm font-medium text-black">
                Not a fact checker
              </div>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                The claim flagger points at what needs a source. It cannot tell
                you whether something is true.
              </p>
            </div>
            <div>
              <div className="text-sm font-medium text-black">
                Not for academic work
              </div>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                This is a writing tool for content writers, marketers, and
                professionals. Follow your publisher&apos;s disclosure rules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-neutral-400">
            Rewrite — a free writing workspace.
          </span>
                    <div className="flex items-center gap-4 text-xs text-neutral-400">
            <Link href="/tools" className="hover:text-black transition-colors">
              Tools
            </Link>
            <Link href="/examples" className="hover:text-black transition-colors">
              Examples
            </Link>
            <Link href="/phrases" className="hover:text-black transition-colors">
              Phrase dictionary
            </Link>
            <Link href="/clipper" className="hover:text-black transition-colors">
              Web Clipper
            </Link>
            <Link href="/terms" className="hover:text-black transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-black transition-colors">
              Privacy
            </Link>
            <Link href="/login" className="hover:text-black transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
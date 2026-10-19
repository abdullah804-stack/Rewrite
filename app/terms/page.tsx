import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-surface-base dark:bg-surface-dark-base text-text-primary dark:text-text-dark-primary transition-colors">
      <header className="border-b border-surface-border dark:border-surface-dark-border sticky top-0 bg-surface-base/80 dark:bg-surface-dark-base/80 backdrop-blur-md z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
              R
            </div>
            Rewrite
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary dark:text-white mb-8">Terms of Service</h1>
        
        <div className="space-y-8 text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed">
          <p className="font-medium text-text-primary dark:text-white">Last updated: October 17, 2026</p>
          
          <section>
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Rewrite, you agree to be bound by these Terms. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-3">2. Description of Service</h2>
            <p>Rewrite is a free writing workspace that uses third-party AI models to rewrite text. You understand that AI can make mistakes, and you are responsible for reviewing the output before publishing.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-3">3. Acceptable Use</h2>
            <p className="mb-2">You agree not to use Rewrite to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Generate spam, malware, or deceptive content.</li>
              <li>Impersonate a real person without their consent.</li>
              <li>Violate any applicable laws.</li>
            </ul>
            <p className="mt-2">We reserve the right to terminate accounts that abuse the service or attempt to bypass rate limits.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-3">4. AI Output & Accuracy</h2>
            <p>We use technical safeguards to protect facts (numbers, URLs, quotes), but we cannot guarantee that the AI will not alter the meaning of your text. The claim flagger is a heuristic tool, not a fact-checker. You are solely responsible for the final content.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-3">5. Data & Privacy</h2>
            <p>Your use of the service is also governed by our <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-3">6. Limitation of Liability</h2>
            <p>Rewrite is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from your use of the service.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
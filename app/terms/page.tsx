import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-surface-base dark:bg-surface-dark-base text-text-primary dark:text-text-dark-primary transition-colors">
      <header className="border-b border-surface-border dark:border-surface-dark-border sticky top-0 bg-surface-base/80 dark:bg-surface-dark-base/80 backdrop-blur-md z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
              R
            </div>
            Rewrite
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* Page Header */}
        <div className="mb-16 pb-8 border-b border-surface-border dark:border-surface-dark-border">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-primary dark:text-white mb-4">
            Terms of Service
          </h1>
          <div className="flex items-center gap-3 text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
            <span className="px-3 py-1 rounded-full bg-surface-raised dark:bg-surface-dark-raised border border-surface-border dark:border-surface-dark-border">
              Last updated: October 17, 2026
            </span>
            <span>·</span>
            <span>Effective immediately</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-12 text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed">
          
          <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-8 items-start">
            <h2 className="text-lg font-bold text-text-primary dark:text-white md:text-right md:pt-1">1. Acceptance</h2>
            <div>
              <p>By accessing or using Rewrite, you agree to be bound by these Terms. If you do not agree with any part of these terms, you must not use the service.</p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-8 items-start">
            <h2 className="text-lg font-bold text-text-primary dark:text-white md:text-right md:pt-1">2. Description of Service</h2>
            <div>
              <p>Rewrite is a free writing workspace that uses third-party AI models to rewrite text. You understand and acknowledge that AI can make mistakes, and you are solely responsible for reviewing, editing, and verifying the output before publishing or using it.</p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-8 items-start">
            <h2 className="text-lg font-bold text-text-primary dark:text-white md:text-right md:pt-1">3. Acceptable Use</h2>
            <div>
              <p className="mb-4">You agree not to use Rewrite to generate or promote:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0"></span>
                  <span>Spam, malware, phishing content, or deceptive material.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0"></span>
                  <span>Content that impersonates a real person without their explicit consent.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0"></span>
                  <span>Any activity that violates applicable local, national, or international laws.</span>
                </li>
              </ul>
              <p className="mt-4 p-4 rounded-xl bg-surface-raised dark:bg-surface-dark-raised border border-surface-border dark:border-surface-dark-border">
                <strong className="text-text-primary dark:text-white">Note:</strong> We reserve the right to suspend or terminate accounts that abuse the service, attempt to bypass rate limits, or violate these terms.
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-8 items-start">
            <h2 className="text-lg font-bold text-text-primary dark:text-white md:text-right md:pt-1">4. AI Output & Accuracy</h2>
            <div>
              <p>We use technical safeguards (tokenization) to protect facts such as numbers, URLs, and quotes. However, we cannot guarantee that the AI will perfectly preserve the nuance or meaning of your text. The claim flagger is a heuristic tool, not a fact-checker. You are solely responsible for the final content.</p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-8 items-start">
            <h2 className="text-lg font-bold text-text-primary dark:text-white md:text-right md:pt-1">5. Data & Privacy</h2>
            <div>
              <p>Your use of the service is also governed by our <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>, which explains how we handle your data.</p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-8 items-start">
            <h2 className="text-lg font-bold text-text-primary dark:text-white md:text-right md:pt-1">6. Limitation of Liability</h2>
            <div>
              <p>Rewrite is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. We are not liable for any damages, losses, or issues arising from your use of the service or reliance on its output.</p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-surface-border dark:border-surface-dark-border text-center">
          <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
            If you have any questions about these Terms, please contact us at <a href="mailto:support@rewrite.app" className="text-brand-600 hover:underline">support@rewrite.app</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
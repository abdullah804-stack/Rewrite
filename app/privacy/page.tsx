import Link from "next/link";

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <div className="flex items-center gap-3 text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
            <span className="px-3 py-1 rounded-full bg-surface-raised dark:bg-surface-dark-raised border border-surface-border dark:border-surface-dark-border">
              Last updated: October 17, 2026
            </span>
            <span>·</span>
            <span>Your data, simplified.</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-12 text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed">
          
          <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-8 items-start">
            <h2 className="text-lg font-bold text-text-primary dark:text-white md:text-right md:pt-1">1. What We Collect</h2>
            <div>
              <p className="mb-3">We only collect what is necessary to run the service:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0"></span>
                  <span><strong>Account Data:</strong> Your email address (via Google Sign-In).</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0"></span>
                  <span><strong>Content Data:</strong> The text you paste into the workspace, and the resulting AI rewrites.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0"></span>
                  <span><strong>Usage Data:</strong> Basic word counts and provider info to enforce free-tier rate limits.</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-8 items-start">
            <h2 className="text-lg font-bold text-text-primary dark:text-white md:text-right md:pt-1">2. How We Use Your Data</h2>
            <div>
              <p className="mb-4">Your text is sent to third-party AI providers (Groq, OpenRouter) specifically to generate the rewrite. We do not train models on your data. We do not sell your data to advertisers or third parties.</p>
              <div className="p-5 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
                <h3 className="font-bold text-brand-900 dark:text-brand-400 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  Fact Protection
                </h3>
                <p className="text-sm text-brand-800 dark:text-brand-300">
                  Before your text is sent to the AI, we mask numbers, URLs, and quotes using tokens. The AI never sees your real facts. They are restored locally after the rewrite.
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-8 items-start">
            <h2 className="text-lg font-bold text-text-primary dark:text-white md:text-right md:pt-1">3. Data Retention</h2>
            <div>
              <p className="mb-3">We believe in not hoarding your data.</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0"></span>
                  <span><strong>Saved documents:</strong> Automatically deleted after 14 days.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0"></span>
                  <span><strong>Voice profiles:</strong> Kept until you explicitly delete them.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0"></span>
                  <span><strong>Account deletion:</strong> You can delete your account and all associated data instantly from the Settings page.</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-8 items-start">
            <h2 className="text-lg font-bold text-text-primary dark:text-white md:text-right md:pt-1">4. AI Providers</h2>
            <div>
              <p>To provide the rewrite service, we route your masked text through our AI provider fallback chain. Their terms of service govern how they handle API requests. We do not deliberately send data to providers that train on user prompts without permission.</p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-8 items-start">
            <h2 className="text-lg font-bold text-text-primary dark:text-white md:text-right md:pt-1">5. Security</h2>
            <div>
              <p>We use industry-standard security measures to protect your data, including HTTPS for all traffic, secure authentication via Google, and standard database encryption at rest.</p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-surface-border dark:border-surface-dark-border text-center">
          <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
            If you have any questions about your privacy, please contact us at <a href="mailto:privacy@rewrite.app" className="text-brand-600 hover:underline">privacy@rewrite.app</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
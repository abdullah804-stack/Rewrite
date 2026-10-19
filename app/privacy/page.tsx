import Link from "next/link";

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary dark:text-white mb-8">Privacy Policy</h1>
        
        <div className="space-y-8 text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed">
          <p className="font-medium text-text-primary dark:text-white">Last updated: October 17, 2026</p>
          
          <section>
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-3">1. What We Collect</h2>
            <p>We collect your email address (via Google Sign-In) and the text you paste into the workspace. We also collect basic usage data (word counts, provider used) to enforce rate limits.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-3">2. How We Use Your Data</h2>
            <p>Your text is sent to third-party AI providers (like Groq or OpenRouter) to generate the rewrite. We do not train models on your data. We do not sell your data.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-3">3. Data Retention</h2>
            <p>Saved documents (drafts and rewrites) are automatically deleted after 14 days. Voice profiles are kept until you delete them. You can delete your account and all associated data at any time in Settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-3">4. AI Providers</h2>
            <p>To provide the rewrite service, we send your text (with personal data like numbers and URLs masked) to our AI providers. Their terms of service govern how they handle API requests. We do not send your data to providers that explicitly train on user data without permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-3">5. Security</h2>
            <p>We use industry-standard security measures, including HTTPS and database encryption at rest.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
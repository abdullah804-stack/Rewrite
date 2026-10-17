import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-black">
            Rewrite
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-semibold text-black mb-8">Privacy Policy</h1>
        
        <div className="prose prose-neutral prose-sm max-w-none text-neutral-600">
          <p>Last updated: October 17, 2026</p>
          
          <h2>1. What We Collect</h2>
          <p>We collect your email address (via Google Sign-In) and the text you paste into the workspace. We also collect basic usage data (word counts, provider used) to enforce rate limits.</p>

          <h2>2. How We Use Your Data</h2>
          <p>Your text is sent to third-party AI providers (like Groq or OpenRouter) to generate the rewrite. We do not train models on your data. We do not sell your data.</p>

          <h2>3. Data Retention</h2>
          <p>Saved documents (drafts and rewrites) are automatically deleted after 14 days. Voice profiles are kept until you delete them. You can delete your account and all associated data at any time in Settings.</p>

          <h2>4. AI Providers</h2>
          <p>To provide the rewrite service, we send your text (with personal data like numbers and URLs masked) to our AI providers. Their terms of service govern how they handle API requests. We do not send your data to providers that explicitly train on user data without permission.</p>

          <h2>5. Security</h2>
          <p>We use industry-standard security measures, including HTTPS and database encryption at rest.</p>
        </div>
      </div>
    </main>
  );
}
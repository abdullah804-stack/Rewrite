import Link from "next/link";

export default function TermsPage() {
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
        <h1 className="text-3xl font-semibold text-black mb-8">Terms of Service</h1>
        
        <div className="prose prose-neutral prose-sm max-w-none text-neutral-600">
          <p>Last updated: October 17, 2026</p>
          
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using Rewrite, you agree to be bound by these Terms. If you do not agree, do not use the service.</p>

          <h2>2. Description of Service</h2>
          <p>Rewrite is a free writing workspace that uses third-party AI models to rewrite text. You understand that AI can make mistakes, and you are responsible for reviewing the output before publishing.</p>

          <h2>3. Acceptable Use</h2>
          <p>You agree not to use Rewrite to:</p>
          <ul>
            <li>Generate spam, malware, or deceptive content.</li>
            <li>Impersonate a real person without their consent.</li>
            <li>Violate any applicable laws.</li>
          </ul>
          <p>We reserve the right to terminate accounts that abuse the service or attempt to bypass rate limits.</p>

          <h2>4. AI Output & Accuracy</h2>
          <p>We use technical safeguards to protect facts (numbers, URLs, quotes), but we cannot guarantee that the AI will not alter the meaning of your text. The claim flagger is a heuristic tool, not a fact-checker. You are solely responsible for the final content.</p>

          <h2>5. Data & Privacy</h2>
          <p>Your use of the service is also governed by our <Link href="/privacy" className="text-black underline">Privacy Policy</Link>.</p>

          <h2>6. Limitation of Liability</h2>
          <p>Rewrite is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service.</p>
        </div>
      </div>
    </main>
  );
}
import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-surface-base dark:bg-surface-dark-base text-text-primary dark:text-text-dark-primary selection:bg-brand-600 selection:text-white overflow-x-hidden">
      
      {/* Primary Header */}
      <header className="border-b border-surface-border dark:border-surface-dark-border sticky top-0 bg-surface-base/80 dark:bg-surface-dark-base/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
              R
            </div>
            Rewrite
          </Link>
          <nav className="flex items-center gap-4 sm:gap-8">
            <Link href="#how-it-works" className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-white transition-colors hidden md:inline">
              How it works
            </Link>
            <Link href="#features" className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-white transition-colors hidden md:inline">
              Features
            </Link>
            <Link href="/tools" className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-white transition-colors hidden sm:inline">
              Free tools
            </Link>
            <div className="h-4 w-px bg-surface-border dark:bg-surface-dark-border hidden sm:block"></div>
            {session?.user ? (
              <Link href="/dashboard" className="text-sm font-medium bg-brand-600 text-white px-5 py-2.5 rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-white transition-colors hidden sm:inline">
                  Sign in
                </Link>
                <Link href="/quick" className="text-sm font-medium bg-text-primary dark:bg-white text-surface-base dark:text-black px-5 py-2.5 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-sm">
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-100/50 dark:bg-brand-900/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 text-brand-700 dark:text-brand-500 text-xs font-bold tracking-wide uppercase mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>
            The standard for AI-assisted writing
          </div>
          
          <h1 className="animate-fade-in-up delay-100 text-5xl sm:text-7xl font-extrabold text-text-primary dark:text-white leading-[1.05] tracking-tight max-w-4xl mx-auto">
            Stop sounding like an AI.
            <br />
            <span className="text-brand-600">Start sounding like you.</span>
          </h1>
          
          <p className="animate-fade-in-up delay-200 text-lg sm:text-xl text-text-secondary dark:text-text-dark-secondary mt-8 max-w-2xl mx-auto leading-relaxed">
            Rewrite is a workspace that transforms robotic AI drafts into natural writing. It matches your voice and mathematically protects your facts, numbers, and URLs.
          </p>

          <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
            <Link
              href="/quick"
              className="w-full sm:w-auto h-14 px-8 rounded-xl bg-brand-600 text-white text-base font-semibold leading-[56px] hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Try the workspace free
            </Link>
            <Link
              href="/tools"
              className="w-full sm:w-auto h-14 px-8 rounded-xl border-2 border-surface-border dark:border-surface-dark-border bg-surface-base dark:bg-surface-dark-raised text-text-primary dark:text-white text-base font-semibold leading-[52px] hover:border-brand-600 dark:hover:border-brand-600 transition-colors"
            >
              Explore the free tools
            </Link>
          </div>
        </div>
      </section>

      {/* Section Nav (Sticky below hero) */}
      <div className="sticky top-16 z-40 bg-surface-base/90 dark:bg-surface-dark-base/90 backdrop-blur-md border-y border-surface-border dark:border-surface-dark-border hidden md:block">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-center gap-12 text-sm font-medium">
          <a href="#how-it-works" className="text-text-secondary dark:text-text-dark-secondary hover:text-brand-600 dark:hover:text-brand-500 transition-colors">How it works</a>
          <a href="#features" className="text-text-secondary dark:text-text-dark-secondary hover:text-brand-600 dark:hover:text-brand-500 transition-colors">Features</a>
          <a href="#pricing" className="text-text-secondary dark:text-text-dark-secondary hover:text-brand-600 dark:hover:text-brand-500 transition-colors">Pricing</a>
          <a href="#security" className="text-text-secondary dark:text-text-dark-secondary hover:text-brand-600 dark:hover:text-brand-500 transition-colors">Security</a>
        </div>
      </div>

      {/* Trust & Social Proof */}
      <section className="border-b border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised py-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-text-secondary dark:text-text-dark-secondary uppercase tracking-widest mb-6">
            Built on a free-tier stack. Zero cost, professional output.
          </p>
          <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-xl font-bold dark:text-white">Next.js</span>
            <span className="text-xl font-bold dark:text-white">Prisma</span>
            <span className="text-xl font-bold dark:text-white">Groq</span>
            <span className="text-xl font-bold dark:text-white">Neon</span>
            <span className="text-xl font-bold dark:text-white">Tailwind</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary dark:text-white tracking-tight">Three steps to perfect writing.</h2>
            <p className="text-lg text-text-secondary dark:text-text-dark-secondary mt-4">We don't just replace words. We interpret your intent, execute a rewrite, and validate the output.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-surface-border dark:bg-surface-dark-border -z-10"></div>

            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-surface-base dark:bg-surface-dark-raised border-4 border-surface-border dark:border-surface-dark-border rounded-full flex items-center justify-center text-brand-600 shadow-sm relative z-10 mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-3">1. Paste your draft</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed">Drop in a ChatGPT or Claude draft. We instantly scan it for AI-isms, unsourced claims, and readability issues.</p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-surface-base dark:bg-surface-dark-raised border-4 border-surface-border dark:border-surface-dark-border rounded-full flex items-center justify-center text-brand-600 shadow-sm relative z-10 mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-3">2. Choose your voice</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed">Select your pre-built Voice Profile. The AI adapts to your specific tone, sentence length, and directness.</p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-surface-base dark:bg-surface-dark-raised border-4 border-surface-border dark:border-surface-dark-border rounded-full flex items-center justify-center text-brand-600 shadow-sm relative z-10 mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-3">3. Review the diff</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed">See sentence-by-sentence changes. Accept what you like, reject what you don't, and export the final result.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-surface-raised dark:bg-surface-dark-raised border-y border-surface-border dark:border-surface-dark-border py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary dark:text-white tracking-tight">Everything you need. Nothing you don't.</h2>
            <p className="text-lg text-text-secondary dark:text-text-dark-secondary mt-4">We built a comprehensive workspace for serious writers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border hover:border-brand-600 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-3">Fact Protection</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed">Every number, URL, quote, and citation is mathematically tokenized before the AI sees it. The model cannot alter your facts.</p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border hover:border-brand-600 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-3">Voice Profiles</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed">Feed it your own writing. The Voice Coach extracts your sentence length, contraction rate, and tone, and forces the AI to match it.</p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border hover:border-brand-600 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-3">Long-Form Mode</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed">Don't let length stop you. Paste up to 5,000 words. We chunk it, process it sequentially, and keep the facts safe.</p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border hover:border-brand-600 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-3">Visual Heatmap</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed">Toggle the Heatmap to instantly see overly long sentences (Red) and passive voice (Yellow) right inside your editor.</p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-3xl bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border hover:border-brand-600 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-3">Projects & Glossaries</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed">Organize drafts into Projects. Set "Never use" rules for specific clients (e.g., ban the word "synergy").</p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-3xl bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border hover:border-brand-600 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-3">Review Links</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed">Generate a read-only link for your editor. They can see the Original vs. Rewritten split and leave comments without an account.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section (Free) */}
      <section id="pricing" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary dark:text-white tracking-tight">Pricing? It's free.</h2>
            <p className="text-lg text-text-secondary dark:text-text-dark-secondary mt-4">No credit card. No trial. No BYOK. Just a free workspace built on free infrastructure.</p>
          </div>

          <div className="max-w-lg mx-auto bg-surface-raised dark:bg-surface-dark-raised p-8 sm:p-12 rounded-[2rem] border-2 border-brand-600 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-bl-lg uppercase tracking-wide">Always Free</div>
            <h3 className="text-2xl font-bold text-text-primary dark:text-white mb-2">The Free Plan</h3>
            <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-8">Everything you need to write naturally.</p>
            
            <div className="text-5xl font-extrabold text-text-primary dark:text-white mb-8">
              $0<span className="text-lg font-medium text-text-secondary dark:text-text-dark-secondary">/forever</span>
            </div>

            <ul className="space-y-4 mb-10">
              {[
                "Unlimited Free Tools (Lint, Claims, Heatmap)",
                "10,000 AI words per day",
                "3 Voice Profiles",
                "Project Glossaries",
                "Long-Form Mode (up to 5,000 words)",
                "Export to TXT, MD, HTML, DOCX",
                "Review Links & Comments"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-text-primary dark:text-white">
                  <svg className="w-5 h-5 text-brand-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/login" className="block w-full h-12 rounded-xl bg-brand-600 text-white text-center leading-[48px] font-semibold hover:bg-brand-700 transition-colors shadow-md">
              Create free account
            </Link>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="border-t border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-text-primary dark:text-white mb-6">Security & Honesty by Design</h2>
          <p className="text-lg text-text-secondary dark:text-text-dark-secondary leading-relaxed mb-10">
            We built this tool for professionals. That means we don't lie to you about what it does. 
            It does not bypass detectors. It does not check facts. It is a writing tool.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
             <div className="p-4 rounded-xl bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border">
               <strong className="block text-sm font-semibold text-text-primary dark:text-white mb-1">No Detector Bypass</strong>
               <span className="text-xs text-text-secondary dark:text-text-dark-secondary">AI detector scores are unreliable. We focus on making the text sound human, not tricking a bot.</span>
             </div>
             <div className="p-4 rounded-xl bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border">
               <strong className="block text-sm font-semibold text-text-primary dark:text-white mb-1">No Fact Checking</strong>
               <span className="text-xs text-text-secondary dark:text-text-dark-secondary">Our Claim Flagger points out unsourced statistics, but it cannot verify if they are true.</span>
             </div>
             <div className="p-4 rounded-xl bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border">
               <strong className="block text-sm font-semibold text-text-primary dark:text-white mb-1">Auto-Delete</strong>
               <span className="text-xs text-text-secondary dark:text-text-dark-secondary">Your documents are deleted from our database after 14 days.</span>
             </div>
             <div className="p-4 rounded-xl bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border">
               <strong className="block text-sm font-semibold text-text-primary dark:text-white mb-1">One-Click Delete</strong>
               <span className="text-xs text-text-secondary dark:text-text-dark-secondary">You can delete your entire account and all data instantly from the Settings page.</span>
             </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-100/50 dark:bg-brand-900/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-text-primary dark:text-white tracking-tight mb-6">
            Ready to sound like yourself again?
          </h2>
          <Link
            href="/quick"
            className="inline-block h-14 px-10 rounded-xl bg-brand-600 text-white text-lg font-semibold leading-[56px] hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Start writing for free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border dark:border-surface-dark-border bg-surface-base dark:bg-surface-dark-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-brand-600 text-white flex items-center justify-center text-xs font-black">
                R
              </div>
              <span className="text-base font-bold text-text-primary dark:text-white">Rewrite</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
              <Link href="/tools" className="hover:text-brand-600 transition-colors">Free Tools</Link>
              <Link href="/examples" className="hover:text-brand-600 transition-colors">Examples</Link>
              <Link href="/phrases" className="hover:text-brand-600 transition-colors">Dictionary</Link>
              <Link href="/clipper" className="hover:text-brand-600 transition-colors">Web Clipper</Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
              <Link href="/terms" className="hover:text-brand-600 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-brand-600 transition-colors">Privacy</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-text-secondary dark:text-text-dark-secondary">
            © {new Date().getFullYear()} Rewrite. A free writing workspace.
          </div>
        </div>
      </footer>

    </main>
  );
}
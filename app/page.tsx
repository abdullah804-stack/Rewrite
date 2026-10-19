import Link from "next/link";
import { auth } from "@/auth";
import { AVATARS, Avatar } from "@/lib/avatars";
import { Logo } from "@/app/Logo";
import { PersonaSlider } from "@/app/PersonaSlider";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-surface-base text-text-primary selection:bg-brand-600 selection:text-white overflow-x-hidden">
      
      {/* Primary Header */}
      <header className="border-b border-surface-border sticky top-0 bg-surface-base/90 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex-shrink-0">
            <Logo />
          </div>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <a href="#how-it-works" className="text-text-secondary hover:text-brand-600 transition-colors">How it works</a>
            <a href="#demo" className="text-text-secondary hover:text-brand-600 transition-colors">See the difference</a>
            <a href="#personas" className="text-text-secondary hover:text-brand-600 transition-colors">Personas</a>
            <a href="#features" className="text-text-secondary hover:text-brand-600 transition-colors">Features</a>
            <a href="#explore" className="text-text-secondary hover:text-brand-600 transition-colors">Explore</a>
            <a href="#pricing" className="text-text-secondary hover:text-brand-600 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link 
              href="/login" 
              className="text-xs sm:text-sm font-semibold bg-surface-base border border-brand-600 text-brand-600 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-brand-50 transition-all shadow-sm"
            >
              Sign in
            </Link>
            {session?.user ? (
              <Link href="/dashboard" className="text-xs sm:text-sm font-semibold bg-brand-600 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
                Dashboard
              </Link>
            ) : (
              <Link href="/quick" className="text-xs sm:text-sm font-semibold bg-brand-600 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
                Get Started
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-24 pb-20 sm:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[300px] sm:h-[500px] bg-brand-50 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[10px] sm:text-xs font-bold tracking-wide uppercase mb-6 sm:mb-8 shadow-sm">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-600 animate-pulse"></span>
            The standard for AI-assisted writing
          </div>
          
          <h1 className="animate-fade-in-up delay-100 text-4xl sm:text-6xl lg:text-7xl font-extrabold text-text-primary leading-[1.1] sm:leading-[1.05] tracking-tight max-w-4xl mx-auto">
            Stop sounding like an AI.
            <br />
            <span className="text-brand-600">Start sounding like you.</span>
          </h1>
          
          <p className="animate-fade-in-up delay-200 text-base sm:text-lg lg:text-xl text-text-secondary mt-6 sm:mt-8 max-w-2xl mx-auto leading-relaxed px-2">
            Rewrite is a workspace that transforms robotic AI drafts into natural writing. It matches your voice and mathematically protects your facts, numbers, and URLs.
          </p>

          <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 sm:mt-12 px-4">
            <Link
              href="/quick"
              className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 rounded-xl bg-brand-600 text-white text-sm sm:text-base font-semibold leading-[48px] sm:leading-[56px] hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Try the workspace free
            </Link>
            <Link
              href="/tools"
              className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 rounded-xl border-2 border-brand-600 bg-surface-base text-brand-600 text-sm sm:text-base font-semibold leading-[44px] sm:leading-[52px] hover:bg-brand-50 transition-colors"
            >
              Explore the free tools
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-20">
            <h2 className="text-2xl sm:text-4xl font-bold text-text-primary tracking-tight">Three steps to perfect writing.</h2>
            <p className="text-sm sm:text-lg text-text-secondary mt-3 sm:mt-4">We don't just replace words. We interpret your intent, execute a rewrite, and mathematically validate the output.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-brand-600 -z-10"></div>

            <div className="p-6 sm:p-8 rounded-3xl bg-surface-raised border border-brand-600 hover:border-brand-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg text-center group">
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-surface-base border-4 border-brand-600 rounded-full flex items-center justify-center text-brand-600 shadow-sm relative z-10 mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3">1. Paste your draft</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">Drop in a ChatGPT or Claude draft. We instantly scan it for AI-isms, unsourced claims, and readability issues.</p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-surface-raised border border-brand-600 hover:border-brand-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg text-center group">
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-surface-base border-4 border-brand-600 rounded-full flex items-center justify-center text-brand-600 shadow-sm relative z-10 mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3">2. Choose your voice</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">Select your pre-built Voice Profile. The AI adapts to your specific tone, sentence length, and directness.</p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-surface-raised border border-brand-600 hover:border-brand-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg text-center group">
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-surface-base border-4 border-brand-600 rounded-full flex items-center justify-center text-brand-600 shadow-sm relative z-10 mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3">3. Review the diff</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">See sentence-by-sentence changes. Accept what you like, reject what you don't, and export the final result.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Before / After Demo */}
      <section id="demo" className="bg-surface-raised border-y border-brand-600 py-16 sm:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-text-primary tracking-tight">See the difference.</h2>
            <p className="text-sm sm:text-lg text-text-secondary mt-3 sm:mt-4">We strip away the AI-isms while keeping every fact perfectly intact.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-surface-base border border-brand-600 relative overflow-hidden hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute top-0 right-0 bg-red-100 text-red-700 text-[9px] sm:text-xs font-bold px-3 sm:px-4 py-1 rounded-bl-lg uppercase tracking-wide">Before (AI)</div>
              <h3 className="text-xs sm:text-sm font-medium text-text-secondary uppercase tracking-widest mb-3 sm:mb-4">The Draft</h3>
              <p className="text-sm sm:text-lg text-text-secondary leading-relaxed">
                "In today's fast-paced digital landscape, it is important to note that we must <span className="bg-red-100 px-1 rounded">delve into</span> the nuances of our <span className="bg-red-100 px-1 rounded">synergy</span>. Studies show that <span className="bg-brand-100 text-brand-700 font-medium px-1 rounded">73%</span> of users <span className="bg-red-100 px-1 rounded">leverage</span> this feature."
              </p>
            </div>

            <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-surface-base border-2 border-brand-500 relative overflow-hidden shadow-lg shadow-brand-500/10 hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute top-0 right-0 bg-brand-500 text-white text-[9px] sm:text-xs font-bold px-3 sm:px-4 py-1 rounded-bl-lg uppercase tracking-wide">After (Rewrite)</div>
              <h3 className="text-xs sm:text-sm font-medium text-brand-600 uppercase tracking-widest mb-3 sm:mb-4">The Result</h3>
              <p className="text-sm sm:text-lg text-text-primary leading-relaxed">
                "We need to <span className="bg-green-100 text-green-700 px-1 rounded font-medium">look closely at</span> how our tools work together. <span className="bg-brand-100 text-brand-700 font-medium px-1 rounded">73%</span> of users <span className="bg-green-100 text-green-700 px-1 rounded font-medium">use</span> this feature."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personas Section */}
      <section id="personas" className="bg-brand-600 py-16 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-20">
            <h2 className="text-2xl sm:text-5xl font-extrabold text-white tracking-tight">Meet your Personas.</h2>
            <p className="text-sm sm:text-lg text-white/90 mt-3 sm:mt-6 leading-relaxed max-w-2xl mx-auto px-2">
              Build a Voice Profile from your own writing, then give it a face. Choose from four distinct personas that adapt the AI's tone to match exactly how you want to sound.
            </p>
          </div>

          {/* Mobile Stepped Slider Component */}
          <PersonaSlider />

          {/* Desktop Grid (Hidden on Mobile) */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {AVATARS.map((a, index) => (
              <div 
                key={`desktop-${a.id}`} 
                className="group relative p-8 rounded-3xl bg-surface-base border border-brand-600 hover:border-brand-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center text-center"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-6 relative group-hover:scale-110 transition-transform duration-500 ease-out">
                  <div className="animate-[bounce_3s_infinite]">
                    <Avatar id={a.id} className="w-32 h-32 shadow-xl" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">{a.name}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {a.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-20">
            <h2 className="text-2xl sm:text-4xl font-bold text-text-primary tracking-tight">Everything you need. Nothing you don't.</h2>
            <p className="text-sm sm:text-lg text-text-secondary mt-3 sm:mt-4">We built a comprehensive workspace for serious writers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-surface-raised border border-brand-600 hover:border-brand-800 transition-all duration-300 group hover:-translate-y-2 hover:shadow-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3">Fact Protection</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">Every number, URL, and quote is tokenized before the AI sees it. The model cannot alter your facts.</p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-surface-raised border border-brand-600 hover:border-brand-800 transition-all duration-300 group hover:-translate-y-2 hover:shadow-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3">Voice Profiles</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">Feed it your own writing. The Voice Coach extracts your sentence length, contraction rate, and tone.</p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-surface-raised border border-brand-600 hover:border-brand-800 transition-all duration-300 group hover:-translate-y-2 hover:shadow-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3">Visual Heatmap</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">Instantly see overly long sentences (Red) and passive voice (Yellow) highlighted in your editor.</p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-surface-raised border border-brand-600 hover:border-brand-800 transition-all duration-300 group hover:-translate-y-2 hover:shadow-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3">Long-Form Mode</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">Don't let length stop you. Paste up to 5,000 words. We chunk it and process it securely.</p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-surface-raised border border-brand-600 hover:border-brand-800 transition-all duration-300 group hover:-translate-y-2 hover:shadow-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3">Projects & Glossaries</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">Organize drafts. Set "Never use" rules for specific clients (e.g., ban the word "synergy").</p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-surface-raised border border-brand-600 hover:border-brand-800 transition-all duration-300 group hover:-translate-y-2 hover:shadow-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3">Review Links</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">Generate a read-only link. Editors can see the Original vs. Rewritten split and leave comments.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Explore Section */}
      <section id="explore" className="bg-surface-raised border-y border-brand-600 py-16 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-20">
            <h2 className="text-2xl sm:text-4xl font-bold text-text-primary tracking-tight">Explore the Tool</h2>
            <p className="text-sm sm:text-lg text-text-secondary mt-3 sm:mt-4">Dive into the resources, free utilities, and integrations we built to make writing easier.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Link href="/tools" className="group p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-surface-base border border-brand-600 hover:border-brand-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary mb-1 sm:mb-2 group-hover:text-brand-600 transition-colors">Free Tools</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">Unlimited linting, claims checking, and readability scores without an account.</p>
            </Link>

            <Link href="/examples" className="group p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-surface-base border border-brand-600 hover:border-brand-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary mb-1 sm:mb-2 group-hover:text-brand-600 transition-colors">Examples</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">See real before-and-after examples of how we strip away the AI-isms.</p>
            </Link>

            <Link href="/phrases" className="group p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-surface-base border border-brand-600 hover:border-brand-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary mb-1 sm:mb-2 group-hover:text-brand-600 transition-colors">Dictionary</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">A comprehensive list of 90+ AI phrases to avoid and what to use instead.</p>
            </Link>

            <Link href="/clipper" className="group p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-surface-base border border-brand-600 hover:border-brand-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary mb-1 sm:mb-2 group-hover:text-brand-600 transition-colors">Web Clipper</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">Use our bookmarklet to rewrite highlighted text from any website instantly.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Security & Honesty Section */}
      <section id="honesty" className="py-16 sm:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-text-primary tracking-tight">Security & Honesty by Design</h2>
            <p className="text-sm sm:text-lg text-text-secondary mt-3 sm:mt-4">We built this tool for professionals. That means we don't lie to you about what it does.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-surface-raised border border-brand-600 flex gap-4 sm:gap-5 hover:border-brand-800 transition-all duration-300 group hover:-translate-y-2 hover:shadow-lg">
              <div className="shrink-0 w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-red-50 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-text-primary mb-1 sm:mb-2">No Detector Bypass</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">AI detector scores are unreliable. We focus on making the text sound human to a human, not tricking a bot.</p>
              </div>
            </div>

            <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-surface-raised border border-brand-600 flex gap-4 sm:gap-5 hover:border-brand-800 transition-all duration-300 group hover:-translate-y-2 hover:shadow-lg">
              <div className="shrink-0 w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-text-primary mb-1 sm:mb-2">No Fact Checking</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">Our Claim Flagger points out unsourced statistics, but it cannot verify if they are true. You are the writer.</p>
              </div>
            </div>

            <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-surface-raised border border-brand-600 flex gap-4 sm:gap-5 hover:border-brand-800 transition-all duration-300 group hover:-translate-y-2 hover:shadow-lg">
              <div className="shrink-0 w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-text-primary mb-1 sm:mb-2">Auto-Delete</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">Your documents are deleted from our database after 14 days. We don't hoard your drafts.</p>
              </div>
            </div>

            <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-surface-raised border border-brand-600 flex gap-4 sm:gap-5 hover:border-brand-800 transition-all duration-300 group hover:-translate-y-2 hover:shadow-lg">
              <div className="shrink-0 w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-green-50 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-text-primary mb-1 sm:mb-2">One-Click Delete</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">You can delete your entire account, voice profiles, and all data instantly from the Settings page.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (Free) */}
      <section id="pricing" className="bg-surface-raised border-y border-brand-600 py-16 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-text-primary tracking-tight">Pricing? It's free.</h2>
            <p className="text-sm sm:text-lg text-text-secondary mt-3 sm:mt-4">No credit card. No trial. No BYOK. Just a free workspace built on free infrastructure.</p>
          </div>

          <div className="max-w-lg mx-auto bg-surface-base p-6 sm:p-12 rounded-3xl sm:rounded-[2rem] border-2 border-brand-600 shadow-2xl relative overflow-hidden hover:-translate-y-2 transition-transform duration-300">
            <div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1 rounded-bl-lg uppercase tracking-wide">Always Free</div>
            <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-1 sm:mb-2">The Free Plan</h3>
            <p className="text-xs sm:text-sm text-text-secondary mb-6 sm:mb-8">Everything you need to write naturally.</p>
            
            <div className="text-4xl sm:text-5xl font-extrabold text-text-primary mb-6 sm:mb-8">
              $0<span className="text-base sm:text-lg font-medium text-text-secondary">/forever</span>
            </div>

            <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
              {[
                "Unlimited Free Tools (Lint, Claims, Heatmap)",
                "10,000 AI words per day",
                "3 Voice Profiles",
                "Project Glossaries",
                "Long-Form Mode (up to 5,000 words)",
                "Export to TXT, MD, HTML, DOCX",
                "Review Links & Comments"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-text-primary">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-brand-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/login" className="block w-full h-11 sm:h-12 rounded-xl bg-brand-600 text-white text-center leading-[44px] sm:leading-[48px] text-sm sm:text-base font-semibold hover:bg-brand-700 transition-colors shadow-md">
              Create free account
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[300px] sm:h-[400px] bg-brand-50 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none -z-10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-text-primary tracking-tight mb-6 sm:mb-8">
            Ready to sound like yourself again?
          </h2>
          <Link
            href="/quick"
            className="inline-block h-12 sm:h-14 px-8 sm:px-10 rounded-xl bg-brand-600 text-white text-base sm:text-lg font-semibold leading-[48px] sm:leading-[56px] hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Start writing for free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-600 border-t border-brand-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
            <div className="bg-white p-1 rounded-lg">
               <Logo />
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-white/90">
              <Link href="/tools" className="hover:text-white transition-colors">Free Tools</Link>
              <Link href="/examples" className="hover:text-white transition-colors">Examples</Link>
              <Link href="/phrases" className="hover:text-white transition-colors">Dictionary</Link>
              <Link href="/clipper" className="hover:text-white transition-colors">Web Clipper</Link>
            </div>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-white/90">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 text-center text-[10px] sm:text-xs font-medium text-white/70">
            © {new Date().getFullYear()} Rewrite. A free writing workspace.
          </div>
        </div>
      </footer>

    </main>
  );
}
import { Logo } from "@/app/Logo";
import { signIn } from "@/auth";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-surface-base text-text-primary">
      {/* Left side - Solid Orange Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-brand-600 p-12 relative overflow-hidden">
        
        <div className="relative z-10 bg-white p-2 rounded-xl w-fit">
          <Logo />
        </div>
        
        <div className="max-w-md relative z-10">
          <h1 className="text-4xl font-extrabold text-white leading-[1.1] tracking-tight">
            Make AI drafts sound <br />like you wrote them.
          </h1>
          <p className="text-lg text-white/90 mt-6 leading-relaxed">
            Paste a draft. Get it back in natural language, in your own voice,
            with every number, URL, and quote mathematically protected.
          </p>
        </div>
        
        <div className="text-sm font-medium text-white/80 flex items-center gap-2 relative z-10">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Free forever. No credit card required.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden mb-12 flex justify-center">
            <Logo />
          </div>

          <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">Sign in</h2>
          <p className="text-base text-text-secondary mt-2 mb-8">
            Continue to your writing workspace.
          </p>

          {/* Google OAuth Button */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="w-full h-12 rounded-xl border border-surface-border bg-surface-raised text-text-primary text-sm font-semibold hover:bg-surface-base transition-all shadow-sm flex items-center justify-center gap-3 mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface-base text-text-secondary">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                className="w-full h-11 px-3 rounded-lg border border-surface-border bg-surface-base text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Email address</label>
              <input 
                type="email" 
                placeholder="you@example.com" 
                className="w-full h-11 px-3 rounded-lg border border-surface-border bg-surface-base text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full h-11 px-3 rounded-lg border border-surface-border bg-surface-base text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand-500"
              />
            </div>
            
            <button 
              type="button" 
              className="w-full h-11 mt-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all shadow-sm"
            >
              Sign in with Email
            </button>
          </form>

          <p className="text-xs text-text-secondary mt-8 text-center px-8 leading-relaxed">
            By signing in you agree to our{" "}
            <Link href="/terms" className="text-text-primary hover:text-brand-600 underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-text-primary hover:text-brand-600 underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
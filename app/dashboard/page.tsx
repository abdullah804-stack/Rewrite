import { Logo } from "@/app/Logo";
import { auth, signOut } from "@/auth";


import { redirect } from "next/navigation";

import Link from "next/link";

import { prisma } from "@/lib/prisma";

import { getLimits } from "@/config/plans";



import { Avatar } from "@/lib/avatars";


export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const today = new Date().toISOString().slice(0, 10);
  
  const [documentsCount, usageToday, totalWordsResult, profiles] = await Promise.all([
    prisma.document.count({ where: { userId: session.user.id } }),
    prisma.usageEvent.aggregate({
      where: { userId: session.user.id, day: today },
      _sum: { words: true },
    }),
    prisma.usageEvent.aggregate({
      where: { userId: session.user.id },
      _sum: { words: true },
    }),
    prisma.voiceProfile.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
  ]);

  const limits = getLimits(session.user.id);
  const wordsUsedToday = usageToday._sum.words ?? 0;
  const totalWordsAllTime = totalWordsResult._sum.words ?? 0;
  const dailyLimit = limits.rewriteWordsPerDay;
  const quotaPercent = Math.min(100, Math.round((wordsUsedToday / dailyLimit) * 100));

  return (
    <main className="min-h-screen bg-surface-base dark:bg-surface-dark-base text-text-primary dark:text-text-dark-primary transition-colors">
      <header className="border-b border-surface-border dark:border-surface-dark-border sticky top-0 bg-surface-base/80 dark:bg-surface-dark-base/80 backdrop-blur-md z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4 sm:gap-6">
            
            <Link
              href="/workspace"
              className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-brand-600 dark:hover:text-brand-500 transition-colors hidden sm:inline"
            >
              Workspace
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-brand-600 dark:hover:text-brand-500 transition-colors hidden sm:inline"
            >
              Settings
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-brand-600 dark:hover:text-brand-500 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary dark:text-white">
          Welcome, {session.user.name?.split(" ")[0] ?? "writer"}
        </h1>
        <p className="text-base text-text-secondary dark:text-text-dark-secondary mt-2">
          Here is your writing activity.
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-10">
          <div className="p-6 rounded-2xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised shadow-sm">
            <div className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">Words rewritten</div>
            <div className="text-3xl font-bold text-text-primary dark:text-white">
              {totalWordsAllTime.toLocaleString()}
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised shadow-sm">
            <div className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">Documents saved</div>
            <div className="text-3xl font-bold text-text-primary dark:text-white">
              {documentsCount}
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised shadow-sm">
            <div className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">Daily quota</div>
            <div className="text-3xl font-bold text-text-primary dark:text-white mb-3">
              {wordsUsedToday} <span className="text-base font-medium text-text-secondary dark:text-text-dark-secondary">/ {dailyLimit}</span>
            </div>
            <div className="h-2 w-full bg-surface-border dark:bg-surface-dark-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${quotaPercent >= 90 ? 'bg-red-500' : 'bg-brand-600'}`}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Personas Row */}
        {profiles.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary dark:text-white">Your Personas</h2>
              <Link href="/profiles" className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                Manage →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {profiles.map((p) => (
                <div key={p.id} className="p-5 rounded-2xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised shadow-sm flex items-center gap-4">
                  <Avatar id={p.avatar || "minimalist"} className="w-12 h-12 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-text-primary dark:text-white truncate">{p.name}</div>
                    <div className="text-xs font-medium text-text-secondary dark:text-text-dark-secondary mt-0.5 truncate">{p.depth} depth</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-text-primary dark:text-white mt-16 mb-6">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Link
            href="/quick"
            className="p-6 sm:p-8 rounded-2xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised hover:border-brand-500 dark:hover:border-brand-500 transition-all group hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div className="text-lg font-bold text-text-primary dark:text-white flex items-center justify-between">
              <span>Quick rewrite</span>
            </div>
            <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-2 leading-relaxed">
              Paste a draft. Get it back natural in about 15 seconds. Facts protected.
            </p>
          </Link>
          <Link
            href="/profiles"
            className="p-6 sm:p-8 rounded-2xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised hover:border-brand-500 dark:hover:border-brand-500 transition-all group hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
            </div>
            <div className="text-lg font-bold text-text-primary dark:text-white flex items-center justify-between">
              <span>Voice profiles</span>
            </div>
            <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-2 leading-relaxed">
              Teach the tool how you write so every rewrite matches your own voice.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}

import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getLimits } from "@/config/plans";
import { ThemeToggle } from "../ThemeToggle";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const today = new Date().toISOString().slice(0, 10);
  
  const [documentsCount, usageToday, totalWordsResult] = await Promise.all([
    prisma.document.count({ where: { userId: session.user.id } }),
    prisma.usageEvent.aggregate({
      where: { userId: session.user.id, day: today },
      _sum: { words: true },
    }),
    prisma.usageEvent.aggregate({
      where: { userId: session.user.id },
      _sum: { words: true },
    }),
  ]);

  const limits = getLimits(session.user.id);
  const wordsUsedToday = usageToday._sum.words ?? 0;
  const totalWordsAllTime = totalWordsResult._sum.words ?? 0;
  const dailyLimit = limits.rewriteWordsPerDay;
  const quotaPercent = Math.min(100, Math.round((wordsUsedToday / dailyLimit) * 100));

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 text-black dark:text-white transition-colors">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-black dark:text-white">
            Rewrite
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <Link
              href="/workspace"
              className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              Workspace
            </Link>
            <Link
              href="/settings"
              className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors hidden sm:inline"
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
                className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-semibold text-black dark:text-white">
          Welcome, {session.user.name?.split(" ")[0] ?? "writer"}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
          Here is your writing activity.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Words rewritten</div>
            <div className="text-2xl font-semibold text-black dark:text-white mt-1">
              {totalWordsAllTime.toLocaleString()}
            </div>
          </div>
          <div className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Documents saved</div>
            <div className="text-2xl font-semibold text-black dark:text-white mt-1">
              {documentsCount}
            </div>
          </div>
          <div className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Daily quota</div>
            <div className="text-2xl font-semibold text-black dark:text-white mt-1">
              {wordsUsedToday} <span className="text-sm font-normal text-neutral-400 dark:text-neutral-500">/ {dailyLimit}</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full ${quotaPercent >= 90 ? 'bg-red-500' : 'bg-black dark:bg-white'}`}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
          </div>
        </div>

        <h2 className="text-lg font-medium text-black dark:text-white mt-12 mb-4">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/quick"
            className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900 transition-colors group"
          >
            <div className="text-sm font-medium text-black dark:text-white flex items-center justify-between">
              <span>Quick rewrite</span>
              <span className="text-neutral-300 dark:text-neutral-600 group-hover:text-black dark:group-hover:text-white transition-colors">→</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
              Paste a draft. Get it back natural in about 15 seconds. Facts protected.
            </p>
          </Link>
          <Link
            href="/profiles"
            className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900 transition-colors group"
          >
            <div className="text-sm font-medium text-black dark:text-white flex items-center justify-between">
              <span>Voice profiles</span>
              <span className="text-neutral-300 dark:text-neutral-600 group-hover:text-black dark:group-hover:text-white transition-colors">→</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
              Teach the tool how you write so every rewrite matches your own voice.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
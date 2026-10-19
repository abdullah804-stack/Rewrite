import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteAccountButton } from "./DeleteAccountButton";
import { ThemeToggle } from "../ThemeToggle";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) redirect("/login");

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
          <div className="flex items-center gap-4 sm:gap-6">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-brand-600 dark:hover:text-brand-500 transition-colors"
            >
              Dashboard
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary dark:text-white">
          Settings
        </h1>
        <p className="text-base text-text-secondary dark:text-text-dark-secondary mt-2">
          Manage your account and data.
        </p>

        <div className="mt-12 space-y-12">
          <section>
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Account</h2>
            <div className="rounded-2xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 text-sm border-b border-surface-border dark:border-surface-dark-border">
                <span className="font-medium text-text-secondary dark:text-text-dark-secondary">Email</span>
                <span className="font-semibold text-text-primary dark:text-white">{user.email}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4 text-sm">
                <span className="font-medium text-text-secondary dark:text-text-dark-secondary">Member since</span>
                <span className="font-semibold text-text-primary dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Data & Privacy</h2>
            <div className="p-6 rounded-2xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed shadow-sm">
              Rewrite is a free writing workspace. We store your drafts and voice profiles so you can access them across devices.
              <br /><br />
              Your documents (drafts and rewrites) are automatically deleted after 14 days. Voice profiles are kept until you delete them.
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-red-600 dark:text-red-500 mb-4">Danger zone</h2>
            <div className="p-6 sm:p-8 rounded-2xl border-2 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <div className="text-lg font-bold text-red-900 dark:text-red-400">
                  Delete account
                </div>
                <div className="text-sm text-red-700 dark:text-red-500 mt-2 max-w-md leading-relaxed">
                  This will permanently delete your account, voice profiles, and all saved documents. This action cannot be undone.
                </div>
              </div>
              <DeleteAccountButton />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
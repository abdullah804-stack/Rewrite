import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteAccountButton } from "./DeleteAccountButton";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-surface-base text-text-primary transition-colors">
      <header className="border-b border-surface-border sticky top-0 bg-surface-base/90 backdrop-blur-md z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs sm:text-sm font-black shadow-sm">
              R
            </div>
            <span className="hidden sm:inline">Rewrite</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors"
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
                className="text-xs sm:text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-text-secondary mt-1 sm:mt-2">
          Manage your account and data.
        </p>

        <div className="mt-8 sm:mt-12 space-y-8 sm:space-y-12">
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-3 sm:mb-4">Account</h2>
            <div className="rounded-xl sm:rounded-2xl border border-surface-border bg-surface-raised overflow-hidden shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 text-sm border-b border-surface-border gap-1">
                <span className="font-medium text-text-secondary">Email</span>
                <span className="font-semibold text-text-primary truncate">{user.email}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 text-sm gap-1">
                <span className="font-medium text-text-secondary">Member since</span>
                <span className="font-semibold text-text-primary">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-3 sm:mb-4">Data & Privacy</h2>
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-surface-border bg-surface-raised text-xs sm:text-sm text-text-secondary leading-relaxed shadow-sm">
              Rewrite is a free writing workspace. We store your drafts and voice profiles so you can access them across devices.
              <br /><br />
              Your documents (drafts and rewrites) are automatically deleted after 14 days. Voice profiles are kept until you delete them.
            </div>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-red-600 mb-3 sm:mb-4">Danger zone</h2>
            <div className="p-4 sm:p-8 rounded-xl sm:rounded-2xl border-2 border-red-200 bg-red-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
              <div>
                <div className="text-base sm:text-lg font-bold text-red-900">
                  Delete account
                </div>
                <div className="text-xs sm:text-sm text-red-700 mt-1 sm:mt-2 max-w-md leading-relaxed">
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
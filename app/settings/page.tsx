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
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-black">
            Rewrite
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-neutral-500 hover:text-black transition-colors"
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
                className="text-sm text-neutral-500 hover:text-black transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-semibold text-black">
          Settings
        </h1>
        <p className="text-sm text-neutral-500 mt-2">
          Manage your account and data.
        </p>

        <div className="mt-10 space-y-10">
          {/* Account Info */}
          <section>
            <h2 className="text-lg font-medium text-black">Account</h2>
            <div className="mt-4 rounded-lg border border-neutral-200 divide-y divide-neutral-200">
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-neutral-500">Email</span>
                <span className="text-black">{user.email}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-neutral-500">Member since</span>
                <span className="text-black">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </section>

          {/* Data & Privacy */}
          <section>
            <h2 className="text-lg font-medium text-black">Data & Privacy</h2>
            <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
              Rewrite is a free writing workspace. We store your drafts and
              voice profiles so you can access them across devices.
              <br />
              <br />
              Your documents (drafts and rewrites) are automatically deleted
              after 14 days. Voice profiles are kept until you delete them.
            </p>
          </section>

          {/* Danger Zone */}
          <section>
            <h2 className="text-lg font-medium text-red-600">Danger zone</h2>
            <div className="mt-4 p-4 rounded-lg border border-red-200 bg-red-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-red-900">
                  Delete account
                </div>
                <div className="text-xs text-red-700 mt-1">
                  This will permanently delete your account, voice profiles, and
                  all saved documents. This action cannot be undone.
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
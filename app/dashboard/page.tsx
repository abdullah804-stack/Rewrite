import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-black">
            Rewrite
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/workspace"
              className="text-sm text-neutral-500 hover:text-black transition-colors font-medium"
            >
              Workspace
            </Link>
            <Link
              href="/settings"
              className="text-sm text-neutral-500 hover:text-black transition-colors hidden sm:inline"
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
                className="text-sm text-neutral-500 hover:text-black transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-semibold text-black">
          Welcome, {session.user.name ?? "writer"}
        </h1>
        <p className="text-sm text-neutral-500 mt-2">
          Your workspace is ready. Start with Quick rewrite or build a voice
          profile.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <Link
            href="/quick"
            className="p-5 rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors"
          >
            <div className="text-sm font-medium text-black">
              Quick rewrite
            </div>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Paste a draft. Get it back natural in about 15 seconds. Facts
              protected.
            </p>
          </Link>
          <Link
            href="/profiles"
            className="p-5 rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors"
          >
            <div className="text-sm font-medium text-black">
              Your voice profiles
            </div>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Teach the tool how you write. Every rewrite then matches your own
              voice.
            </p>
          </Link>
          <Link
            href="/workspace"
            className="p-5 rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors"
          >
            <div className="text-sm font-medium text-black">
              Workspace
            </div>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Organize your drafts into projects and folders.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewProfileForm } from "./NewProfileForm";

export default async function ProfilesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profiles = await prisma.voiceProfile.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-black">
            Rewrite
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/quick"
              className="text-sm text-neutral-500 hover:text-black transition-colors"
            >
              Quick rewrite
            </Link>
            <Link
              href="/tools"
              className="text-sm text-neutral-500 hover:text-black transition-colors hidden sm:inline"
            >
              Free tools
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-semibold text-black">
          Your voice profiles
        </h1>
        <p className="text-sm text-neutral-500 mt-2 max-w-xl">
          A voice profile is built from your own writing. Once created, every
          rewrite can match it. Free plan includes up to 3 profiles.
        </p>

        {/* Existing profiles */}
        {profiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            {profiles.map((p) => {
              const profile = p.profile as {
                interpreted?: { summary?: string };
                measured?: { readingGrade?: number };
              };
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-lg border border-neutral-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-medium text-black">
                      {p.name}
                    </div>
                    <span className="text-xs text-neutral-400 px-2 py-0.5 rounded bg-neutral-100">
                      {p.depth}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2 leading-relaxed line-clamp-3">
                    {profile.interpreted?.summary ?? "No summary."}
                  </p>
                  <div className="text-xs text-neutral-400 mt-3">
                    {p.sampleWords} words · grade{" "}
                    {profile.measured?.readingGrade ?? "?"}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* New profile form */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-black">
            {profiles.length === 0
              ? "Create your first voice profile"
              : "Add another voice profile"}
          </h2>
          <NewProfileForm disabled={profiles.length >= 3} />
        </div>
      </div>
    </main>
  );
}
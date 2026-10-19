import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewProfileForm } from "./NewProfileForm";
import { Avatar } from "@/lib/avatars";

export default async function ProfilesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profiles = await prisma.voiceProfile.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-surface-base text-text-primary transition-colors">
      <header className="border-b border-surface-border sticky top-0 bg-surface-base/90 backdrop-blur-md z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs sm:text-sm font-black shadow-sm">
              R
            </div>
            <span className="hidden sm:inline">Rewrite</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/quick"
              className="text-xs sm:text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors"
            >
              Quick rewrite
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
          Voice profiles
        </h1>
        <p className="text-sm sm:text-base text-text-secondary mt-1 sm:mt-2 max-w-2xl">
          A voice profile is built from your own writing. Once created, every
          rewrite can match it. Free plan includes up to 3 profiles.
        </p>

        {profiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-10">
            {profiles.map((p) => {
              const profile = p.profile as {
                interpreted?: { summary?: string };
                measured?: { readingGrade?: number };
              };
              return (
                <div
                  key={p.id}
                  className="p-5 sm:p-6 rounded-2xl border border-surface-border bg-surface-raised shadow-sm hover:border-brand-500 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Avatar id={p.avatar || "minimalist"} className="w-8 h-8 sm:w-10 sm:h-10" />
                      <div className="text-base sm:text-lg font-bold text-text-primary">
                        {p.name}
                      </div>
                    </div>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-brand-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-brand-50 border border-brand-100">
                      {p.depth}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed line-clamp-3 mb-3 sm:mb-4">
                    {profile.interpreted?.summary ?? "No summary."}
                  </p>
                  <div className="text-[11px] sm:text-xs font-medium text-text-secondary flex items-center gap-2 sm:gap-3">
                    <span>{p.sampleWords} words</span>
                    <span className="w-1 h-1 rounded-full bg-surface-border"></span>
                    <span>Grade {profile.measured?.readingGrade ?? "?"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 sm:mt-16">
          <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-4 sm:mb-6">
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
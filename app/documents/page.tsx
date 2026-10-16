import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      revisions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
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
          Your documents
        </h1>
        <p className="text-sm text-neutral-500 mt-2">
          Recent rewrites are kept for 14 days, then deleted automatically.
        </p>

        {documents.length === 0 ? (
          <div className="mt-8 p-5 rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-500">
            No documents yet. Rewrites you save appear here.
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-neutral-200 border-t border-neutral-200">
            {documents.map((d) => (
              <li key={d.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-black truncate">
                      {d.title}
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      {new Date(d.updatedAt).toLocaleString()} ·{" "}
                      {d.revisions.length} revision
                      {d.revisions.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <Link
                    href="/quick"
                    className="text-xs text-neutral-500 hover:text-black transition-colors whitespace-nowrap"
                  >
                    Open →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
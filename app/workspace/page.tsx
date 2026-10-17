import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewProjectButton } from "./NewProjectButton";
import { ThemeToggle } from "../ThemeToggle";

export default async function WorkspacePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [projects, documents] = await Promise.all([
    prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { documents: true } } },
    }),
    prisma.document.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 text-black dark:text-white transition-colors">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-black dark:text-white">
            Rewrite
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <Link href="/settings" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors hidden sm:inline">
              Settings
            </Link>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black dark:text-white">Workspace</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Organize your drafts into projects.</p>
          </div>
          <Link
            href="/quick"
            className="h-10 px-5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-medium leading-[40px] hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors whitespace-nowrap"
          >
            New rewrite
          </Link>
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-black dark:text-white">Projects</h2>
            <NewProjectButton />
          </div>
          
          {projects.length === 0 ? (
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-500 dark:text-neutral-400 text-center">
              No projects yet. Create one to organize your drafts.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <Link key={p.id} href={`/workspace/${p.id}`} className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors">
                  <div className="text-sm font-medium text-black dark:text-white truncate">{p.name}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{p._count.documents} documents</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-medium text-black dark:text-white mb-4">Recent drafts</h2>
          {documents.length === 0 ? (
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-500 dark:text-neutral-400 text-center">
              No drafts yet. Start a rewrite to see them here.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 border-t border-neutral-200 dark:border-neutral-800">
              {documents.map((d) => (
                <li key={d.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-black dark:text-white truncate">{d.title}</div>
                      <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                        {new Date(d.updatedAt).toLocaleString()} · {d.preset}
                      </div>
                    </div>
                    <Link href="/quick" className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors whitespace-nowrap">
                      Open →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewProjectButton } from "./NewProjectButton";

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
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-black">
            Rewrite
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/settings" className="text-sm text-neutral-500 hover:text-black transition-colors hidden sm:inline">
              Settings
            </Link>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" className="text-sm text-neutral-500 hover:text-black transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black">Workspace</h1>
            <p className="text-sm text-neutral-500 mt-1">Organize your drafts into projects.</p>
          </div>
          <Link
            href="/quick"
            className="h-10 px-5 rounded-lg bg-black text-white text-sm font-medium leading-[40px] hover:bg-neutral-800 transition-colors whitespace-nowrap"
          >
            New rewrite
          </Link>
        </div>

        {/* Projects */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-black">Projects</h2>
            <NewProjectButton />
          </div>
          
          {projects.length === 0 ? (
            <div className="p-6 rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-500 text-center">
              No projects yet. Create one to organize your drafts.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <Link key={p.id} href={`/workspace/${p.id}`} className="p-5 rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors">
                  <div className="text-sm font-medium text-black truncate">{p.name}</div>
                  <div className="text-xs text-neutral-500 mt-1">{p._count.documents} documents</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Documents (Ungrouped) */}
        <div className="mt-12">
          <h2 className="text-lg font-medium text-black mb-4">Recent drafts</h2>
          {documents.length === 0 ? (
            <div className="p-6 rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-500 text-center">
              No drafts yet. Start a rewrite to see them here.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200 border-t border-neutral-200">
              {documents.map((d) => (
                <li key={d.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-black truncate">{d.title}</div>
                      <div className="text-xs text-neutral-400 mt-1">
                        {new Date(d.updatedAt).toLocaleString()} · {d.preset}
                      </div>
                    </div>
                    <Link href="/quick" className="text-xs text-neutral-500 hover:text-black transition-colors whitespace-nowrap">
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
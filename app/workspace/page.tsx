import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewProjectButton } from "./NewProjectButton";
import { Logo } from "../Logo";

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
    <main className="min-h-screen bg-surface-base text-text-primary transition-colors">
      <header className="border-b border-surface-border sticky top-0 bg-surface-base/90 backdrop-blur-md z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3 sm:gap-6">
            <Link 
              href="/settings" 
              className="text-xs sm:text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors hidden sm:inline"
            >
              Settings
            </Link>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" className="text-xs sm:text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-10 sm:mb-12">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">Workspace</h1>
            <p className="text-sm sm:text-base text-text-secondary mt-1 sm:mt-2">Organize your drafts into projects.</p>
          </div>
          <Link
            href="/quick"
            className="w-full sm:w-auto h-11 sm:h-12 px-6 rounded-xl bg-brand-600 text-white text-sm font-semibold leading-[44px] sm:leading-[48px] hover:bg-brand-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 text-center"
          >
            + New rewrite
          </Link>
        </div>

        <div className="mb-12 sm:mb-16">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-text-primary">Projects</h2>
            <NewProjectButton />
          </div>
          
          {projects.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-2xl border border-dashed border-surface-border bg-surface-raised text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-border flex items-center justify-center text-text-secondary mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary">No projects yet. Create one to organize your drafts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {projects.map((p) => (
                <Link 
                  key={p.id} 
                  href={`/workspace/${p.id}`} 
                  className="group p-5 sm:p-6 rounded-2xl bg-surface-raised border border-surface-border hover:border-brand-500 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-surface-base border border-surface-border flex items-center justify-center text-brand-600 mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-text-primary truncate">{p.name}</h3>
                  <p className="text-xs sm:text-sm text-text-secondary mt-1">{p._count.documents} documents</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-4 sm:mb-6">Recent drafts</h2>
          {documents.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-2xl border border-dashed border-surface-border bg-surface-raised text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-border flex items-center justify-center text-text-secondary mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary">No drafts yet. Start a rewrite to see them here.</p>
            </div>
          ) : (
            <div className="bg-surface-raised rounded-2xl border border-surface-border overflow-hidden">
              <ul className="divide-y divide-surface-border">
                {documents.map((d) => (
                  <li key={d.id}>
                    <Link href="/quick" className="block p-4 sm:p-5 hover:bg-surface-base transition-colors group">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex items-center gap-3 sm:gap-4">
                          <div className="w-8 h-8 sm:w-8 sm:h-8 rounded bg-surface-base border border-surface-border flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          </div>
                          <div>
                            <div className="text-sm sm:text-sm font-semibold text-text-primary truncate group-hover:text-brand-600 transition-colors">
                              {d.title}
                            </div>
                            <div className="text-[11px] sm:text-xs text-text-secondary mt-0.5 sm:mt-1">
                              {new Date(d.updatedAt).toLocaleDateString()} · {d.preset}
                            </div>
                          </div>
                        </div>
                        <div className="text-text-secondary group-hover:text-brand-600 transition-colors">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
import { Logo } from "@/app/Logo";
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
    <main className="min-h-screen bg-surface-base dark:bg-surface-dark-base text-text-primary dark:text-text-dark-primary transition-colors">
      <header className="border-b border-surface-border dark:border-surface-dark-border sticky top-0 bg-surface-base/80 dark:bg-surface-dark-base/80 backdrop-blur-md z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4 sm:gap-6">
            
            <Link 
              href="/settings" 
              className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-brand-600 dark:hover:text-brand-500 transition-colors hidden sm:inline"
            >
              Settings
            </Link>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-brand-600 dark:hover:text-brand-500 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary dark:text-white">Workspace</h1>
            <p className="text-base text-text-secondary dark:text-text-dark-secondary mt-2">Organize your drafts into projects.</p>
          </div>
          <Link
            href="/quick"
            className="w-full sm:w-auto h-12 px-6 rounded-xl bg-brand-600 text-white text-sm font-semibold leading-[48px] hover:bg-brand-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 text-center"
          >
            + New rewrite
          </Link>
        </div>

        {/* Projects Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary dark:text-white">Projects</h2>
            <NewProjectButton />
          </div>
          
          {projects.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-surface-border dark:bg-surface-dark-border flex items-center justify-center text-text-secondary dark:text-text-dark-secondary mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
              </div>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">No projects yet. Create one to organize your drafts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {projects.map((p) => (
                <Link 
                  key={p.id} 
                  href={`/workspace/${p.id}`} 
                  className="group p-6 rounded-2xl bg-surface-raised dark:bg-surface-dark-raised border border-surface-border dark:border-surface-dark-border hover:border-brand-500 dark:hover:border-brand-500 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border flex items-center justify-center text-brand-600 mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary dark:text-white truncate">{p.name}</h3>
                  <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-1">{p._count.documents} documents</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Drafts Section */}
        <div>
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-6">Recent drafts</h2>
          {documents.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-surface-border dark:bg-surface-dark-border flex items-center justify-center text-text-secondary dark:text-text-dark-secondary mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">No drafts yet. Start a rewrite to see them here.</p>
            </div>
          ) : (
            <div className="bg-surface-raised dark:bg-surface-dark-raised rounded-2xl border border-surface-border dark:border-surface-dark-border overflow-hidden">
              <ul className="divide-y divide-surface-border dark:divide-surface-dark-border">
                {documents.map((d) => (
                  <li key={d.id}>
                    <Link href="/quick" className="block p-4 sm:p-5 hover:bg-surface-base dark:hover:bg-surface-dark-base transition-colors group">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex items-center gap-4">
                          <div className="w-8 h-8 rounded bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border flex items-center justify-center shrink-0 hidden sm:flex">
                            <svg className="w-4 h-4 text-text-secondary dark:text-text-dark-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-text-primary dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-500 transition-colors">
                              {d.title}
                            </div>
                            <div className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                              {new Date(d.updatedAt).toLocaleDateString()} · {d.preset}
                            </div>
                          </div>
                        </div>
                        <div className="text-text-secondary dark:text-text-dark-secondary group-hover:text-brand-600 dark:group-hover:text-brand-500 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
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

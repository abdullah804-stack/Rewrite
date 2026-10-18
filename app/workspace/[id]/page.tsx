import { auth, signOut } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "../../ThemeToggle";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      documents: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!project) notFound();

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 text-black dark:text-white transition-colors">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-black dark:text-white">
              Rewrite
            </Link>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <Link href="/workspace" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
              Workspace
            </Link>
          </div>
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
            <h1 className="text-2xl sm:text-3xl font-semibold text-black dark:text-white">{project.name}</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{project.documents.length} documents</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/workspace/${project.id}/settings`}
              className="h-10 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-medium leading-[38px] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Settings
            </Link>
            <Link
              href="/quick"
              className="h-10 px-5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-medium leading-[40px] hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors whitespace-nowrap"
            >
              New rewrite
            </Link>
          </div>
        </div>

        <div className="mt-8">
          {project.documents.length === 0 ? (
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-500 dark:text-neutral-400 text-center">
              This project is empty. Start a rewrite and select this project from the toolbar to save a draft here.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 border-t border-neutral-200 dark:border-neutral-800">
              {project.documents.map((d) => (
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
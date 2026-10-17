import { auth, signOut } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

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
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-black">
              Rewrite
            </Link>
            <span className="text-neutral-300">/</span>
            <Link href="/workspace" className="text-sm text-neutral-500 hover:text-black transition-colors">
              Workspace
            </Link>
          </div>
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
            <h1 className="text-2xl sm:text-3xl font-semibold text-black">{project.name}</h1>
            <p className="text-sm text-neutral-500 mt-1">{project.documents.length} documents</p>
          </div>
          <Link
            href="/quick"
            className="h-10 px-5 rounded-lg bg-black text-white text-sm font-medium leading-[40px] hover:bg-neutral-800 transition-colors whitespace-nowrap"
          >
            New rewrite
          </Link>
        </div>

        <div className="mt-8">
          {project.documents.length === 0 ? (
            <div className="p-6 rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-500 text-center">
              This project is empty. Start a rewrite and select this project from the toolbar to save a draft here.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200 border-t border-neutral-200">
              {project.documents.map((d) => (
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
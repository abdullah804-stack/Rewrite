import { auth, signOut } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProjectSettingsForm } from "./ProjectSettingsForm";
import { ThemeToggle } from "../../../ThemeToggle";

export default async function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!project) notFound();

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 text-black dark:text-white transition-colors">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-black dark:text-white">
              Rewrite
            </Link>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <Link href="/workspace" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
              Workspace
            </Link>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <Link href={`/workspace/${project.id}`} className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
              {project.name}
            </Link>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-semibold text-black dark:text-white">
          Project settings
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
          Configure rules specifically for <strong className="text-black dark:text-white">{project.name}</strong>.
        </p>

        <div className="mt-8">
          <ProjectSettingsForm projectId={project.id} initialGlossary={project.glossary} />
        </div>
      </div>
    </main>
  );
}
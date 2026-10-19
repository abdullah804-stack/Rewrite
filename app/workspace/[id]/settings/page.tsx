import { Logo } from "@/app/Logo";
import { auth, signOut } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProjectSettingsForm } from "./ProjectSettingsForm";


export default async function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!project) notFound();

  return (
    <main className="min-h-screen bg-surface-base dark:bg-surface-dark-base text-text-primary dark:text-text-dark-primary transition-colors">
      <header className="border-b border-surface-border dark:border-surface-dark-border sticky top-0 bg-surface-base/80 dark:bg-surface-dark-base/80 backdrop-blur-md z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="text-surface-border dark:text-surface-dark-border">/</span>
            <Link href="/workspace" className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-brand-600 dark:hover:text-brand-500 transition-colors">
              Workspace
            </Link>
            <span className="text-surface-border dark:text-surface-dark-border">/</span>
            <Link href={`/workspace/${project.id}`} className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-brand-600 dark:hover:text-brand-500 transition-colors">
              {project.name}
            </Link>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-brand-600 dark:hover:text-brand-500 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary dark:text-white">
            Project settings
          </h1>
          <p className="text-base text-text-secondary dark:text-text-dark-secondary mt-2">
            Configure rules specifically for <strong className="text-text-primary dark:text-white">{project.name}</strong>.
          </p>
        </div>

        <div className="p-6 sm:p-10 rounded-3xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised shadow-sm">
          <ProjectSettingsForm projectId={project.id} initialGlossary={project.glossary} />
        </div>
      </div>
    </main>
  );
}
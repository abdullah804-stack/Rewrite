import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-medium text-black">Rewrite</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-500">
              {session.user.email}
            </span>
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

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-black">
          Welcome, {session.user.name ?? "writer"}
        </h1>
        <p className="text-sm text-neutral-500 mt-2">
          Your workspace is empty. The editor arrives in the next phase.
        </p>
      </div>
    </main>
  );
}
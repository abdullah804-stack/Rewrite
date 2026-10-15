import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-6">
        <h1 className="text-2xl font-semibold text-black text-center">
          Sign in to Rewrite
        </h1>
        <p className="text-sm text-neutral-500 text-center mt-2">
          A free writing workspace that makes AI drafts sound natural.
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
          className="mt-8"
        >
          <button
            type="submit"
            className="w-full h-11 rounded-lg border border-neutral-200 bg-white text-black text-sm font-medium hover:bg-neutral-50 transition-colors"
          >
            Continue with Google
          </button>
        </form>

        <p className="text-xs text-neutral-400 text-center mt-6">
          By signing in you agree to our terms and privacy policy.
        </p>
      </div>
    </main>
  );
}
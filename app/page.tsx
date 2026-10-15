import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md px-6 text-center">
        <h1 className="text-3xl font-semibold text-black">Rewrite</h1>
        <p className="text-sm text-neutral-500 mt-3">
          Paste a draft. Get it back in your voice. Facts protected.
        </p>
        <Link
          href="/login"
          className="inline-block mt-8 h-11 px-6 rounded-lg bg-black text-white text-sm font-medium leading-[44px] hover:bg-neutral-800 transition-colors"
        >
          Get started
        </Link>
      </div>
    </main>
  );
}
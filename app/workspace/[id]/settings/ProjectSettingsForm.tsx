"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Glossary = {
  alwaysUse: string[];
  neverUse: string[];
  keepAsIs: string[];
};

export function ProjectSettingsForm({ 
  projectId, 
  initialGlossary 
}: { 
  projectId: string; 
  initialGlossary: any;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedInitial: Glossary = initialGlossary || { alwaysUse: [], neverUse: [], keepAsIs: [] };

  const [alwaysUse, setAlwaysUse] = useState(parsedInitial.alwaysUse.join(", "));
  const [neverUse, setNeverUse] = useState(parsedInitial.neverUse.join(", "));
  const [keepAsIs, setKeepAsIs] = useState(parsedInitial.keepAsIs.join(", "));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const glossary: Glossary = {
      alwaysUse: alwaysUse.split(",").map(s => s.trim()).filter(Boolean),
      neverUse: neverUse.split(",").map(s => s.trim()).filter(Boolean),
      keepAsIs: keepAsIs.split(",").map(s => s.trim()).filter(Boolean),
    };

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ glossary }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-600 dark:text-neutral-400">
        These rules override global glossaries when you rewrite a document inside this project.
      </div>

      <div>
        <label className="block text-sm font-medium text-black dark:text-white mb-1">
          Always use these terms
        </label>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Comma-separated. The AI will try to include these.</p>
        <input
          type="text"
          value={alwaysUse}
          onChange={(e) => setAlwaysUse(e.target.value)}
          placeholder="e.g. AI-first, our platform, customer success"
          className="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm text-black dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black dark:text-white mb-1">
          Never use these terms
        </label>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Comma-separated. The AI will reject any rewrite that includes these.</p>
        <input
          type="text"
          value={neverUse}
          onChange={(e) => setNeverUse(e.target.value)}
          placeholder="e.g. synergy, leverage, disrupt"
          className="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm text-black dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black dark:text-white mb-1">
          Keep exactly as is
        </label>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Comma-separated. Brand names or code terms that must not be altered.</p>
        <input
          type="text"
          value={keepAsIs}
          onChange={(e) => setKeepAsIs(e.target.value)}
          placeholder="e.g. Next.js, OpenAI, JavaScript"
          className="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm text-black dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
        />
      </div>

      {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
      {success && <div className="text-sm text-green-700 dark:text-green-500">Settings saved successfully.</div>}

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="h-10 px-5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 transition-colors"
        >
          {loading ? "Saving..." : "Save project settings"}
        </button>
      </div>
    </form>
  );
}
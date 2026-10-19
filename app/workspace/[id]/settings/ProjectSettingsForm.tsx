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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="p-5 rounded-2xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 text-sm font-medium text-brand-800 dark:text-brand-300">
        These rules override global glossaries when you rewrite a document inside this project.
      </div>

      <div>
        <label className="block text-base font-bold text-text-primary dark:text-white mb-1">
          Always use these terms
        </label>
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-3">Comma-separated. The AI will try to include these.</p>
        <input
          type="text"
          value={alwaysUse}
          onChange={(e) => setAlwaysUse(e.target.value)}
          placeholder="e.g. AI-first, our platform, customer success"
          className="w-full h-12 px-4 rounded-xl border border-surface-border dark:border-surface-dark-border bg-surface-base dark:bg-surface-dark-base text-sm font-medium text-text-primary dark:text-white placeholder:text-text-secondary dark:placeholder:text-text-dark-secondary focus:outline-none focus:border-brand-500 transition-colors shadow-sm"
        />
      </div>

      <div>
        <label className="block text-base font-bold text-text-primary dark:text-white mb-1">
          Never use these terms
        </label>
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-3">Comma-separated. The AI will reject any rewrite that includes these.</p>
        <input
          type="text"
          value={neverUse}
          onChange={(e) => setNeverUse(e.target.value)}
          placeholder="e.g. synergy, leverage, disrupt"
          className="w-full h-12 px-4 rounded-xl border border-surface-border dark:border-surface-dark-border bg-surface-base dark:bg-surface-dark-base text-sm font-medium text-text-primary dark:text-white placeholder:text-text-secondary dark:placeholder:text-text-dark-secondary focus:outline-none focus:border-brand-500 transition-colors shadow-sm"
        />
      </div>

      <div>
        <label className="block text-base font-bold text-text-primary dark:text-white mb-1">
          Keep exactly as is
        </label>
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-3">Comma-separated. Brand names or code terms that must not be altered.</p>
        <input
          type="text"
          value={keepAsIs}
          onChange={(e) => setKeepAsIs(e.target.value)}
          placeholder="e.g. Next.js, OpenAI, JavaScript"
          className="w-full h-12 px-4 rounded-xl border border-surface-border dark:border-surface-dark-border bg-surface-base dark:bg-surface-dark-base text-sm font-medium text-text-primary dark:text-white placeholder:text-text-secondary dark:placeholder:text-text-dark-secondary focus:outline-none focus:border-brand-500 transition-colors shadow-sm"
        />
      </div>

      <div className="pt-4 border-t border-surface-border dark:border-surface-dark-border">
        {error && <div className="text-sm font-bold text-red-600 dark:text-red-400 mb-4">{error}</div>}
        {success && <div className="text-sm font-bold text-green-600 dark:text-green-500 mb-4">Settings saved successfully.</div>}

        <button
          type="submit"
          disabled={loading}
          className="h-12 px-8 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:bg-surface-border dark:disabled:bg-surface-dark-border disabled:text-text-secondary dark:disabled:text-text-dark-secondary transition-all shadow-sm hover:shadow-md"
        >
          {loading ? "Saving..." : "Save project settings"}
        </button>
      </div>
    </form>
  );
}
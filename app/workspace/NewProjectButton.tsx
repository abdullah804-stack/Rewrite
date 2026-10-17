"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProjectButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create project");

      setIsOpen(false);
      setName("");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm font-medium text-black hover:underline"
      >
        + New project
      </button>
    );
  }

  return (
    <form onSubmit={handleCreate} className="flex items-center gap-2">
      <input
        type="text"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name"
        className="h-8 px-2 rounded-md border border-neutral-200 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
        onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="h-8 px-3 rounded-md bg-black text-white text-xs font-medium hover:bg-neutral-800 disabled:bg-neutral-300"
      >
        {loading ? "..." : "Save"}
      </button>
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="h-8 px-3 rounded-md text-xs font-medium text-neutral-500 hover:text-black"
      >
        Cancel
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
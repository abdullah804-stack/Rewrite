"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProjectOption = {
  id: string;
  name: string;
};

export function ProjectPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) {
          setLoaded(true);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setProjects(data.projects ?? []);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) {
    return (
      <div className="text-xs text-neutral-400 h-8 flex items-center px-2">
        Loading projects…
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-8 px-2 pr-8 rounded-md border border-neutral-200 text-xs text-black bg-white focus:outline-none focus:border-neutral-400 max-w-[150px] truncate"
      >
        <option value="">No project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {projects.length === 0 && (
        <Link
          href="/workspace"
          className="text-xs text-neutral-500 hover:text-black whitespace-nowrap hidden sm:inline"
        >
          + Create
        </Link>
      )}
    </div>
  );
}
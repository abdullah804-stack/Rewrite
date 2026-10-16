"use client";

import { useEffect, useState } from "react";

export type ProfileOption = {
  id: string;
  name: string;
  depth: string;
};

export function ProfilePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/profiles");
        if (!res.ok) {
          setLoaded(true);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        const list: ProfileOption[] = (data.profiles ?? []).map(
          (p: { id: string; name: string; depth: string }) => ({
            id: p.id,
            name: p.name,
            depth: p.depth,
          })
        );
        setProfiles(list);
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
      <div className="text-xs text-neutral-400 px-3 h-8 flex items-center">
        Loading voices…
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <a
        href="/profiles"
        className="text-xs text-neutral-500 hover:text-black transition-colors px-3 h-8 flex items-center"
      >
        + Create a voice profile
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-neutral-500 hidden sm:inline">Voice:</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-8 px-2 pr-8 rounded-md border border-neutral-200 text-xs text-black bg-white focus:outline-none focus:border-neutral-400"
      >
        <option value="">Default (natural)</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/lib/avatars";

type ProfileOption = {
  id: string;
  name: string;
  avatar: string;
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
        setProfiles(data.profiles ?? []);
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
      <div className="text-xs text-neutral-400 h-9 flex items-center px-3">
        Loading voices…
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <Link
        href="/profiles"
        className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors px-3 h-9 flex items-center"
      >
        + Create a voice profile
      </Link>
    );
  }

  const selectedProfile = profiles.find((p) => p.id === value);

  return (
    <div className="relative flex items-center bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border rounded-lg h-9 px-3 shadow-sm">
      {selectedProfile && (
        <div className="mr-2">
          <Avatar id={selectedProfile.avatar || "minimalist"} className="w-5 h-5" />
        </div>
      )}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="appearance-none bg-transparent text-sm font-semibold text-text-primary dark:text-white focus:outline-none pr-6 cursor-pointer"
      >
        <option value="" className="text-text-primary">Default (natural)</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id} className="text-text-primary">
            {p.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
    </div>
  );
}
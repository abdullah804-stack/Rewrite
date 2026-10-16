"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProfileForm({ disabled }: { disabled: boolean }) {
  const [name, setName] = useState("");
  const [samples, setSamples] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const totalWords = samples.join(" ").trim().split(/\s+/).filter(Boolean).length;

  function updateSample(index: number, value: string) {
    setSamples((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function addSample() {
    if (samples.length >= 5) return;
    setSamples((prev) => [...prev, ""]);
  }

  function removeSample(index: number) {
    if (samples.length <= 1) return;
    setSamples((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          samples: samples.filter((s) => s.trim().length > 0),
          depth: "standard",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to build the profile.");
        return;
      }

      setSuccess(true);
      setName("");
      setSamples([""]);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (disabled) {
    return (
      <div className="mt-4 p-4 rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-500">
        Free plan allows 3 voice profiles. Delete one to create another.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
          Profile name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My blog voice, Newsletter, LinkedIn"
          className="mt-2 w-full h-11 px-4 rounded-lg border border-neutral-200 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            Writing samples
          </label>
          <span className="text-xs text-neutral-400">
            {totalWords} words · min 100
          </span>
        </div>

        <div className="mt-2 space-y-2">
          {samples.map((sample, i) => (
            <div key={i} className="relative">
              <textarea
                value={sample}
                onChange={(e) => updateSample(i, e.target.value)}
                placeholder={`Sample ${i + 1} — paste 150+ words you wrote`}
                rows={4}
                className="w-full p-3 rounded-lg border border-neutral-200 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 resize-none"
              />
              {samples.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSample(i)}
                  className="absolute top-2 right-2 text-xs text-neutral-400 hover:text-black transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {samples.length < 5 && (
          <button
            type="button"
            onClick={addSample}
            className="mt-2 text-xs text-neutral-500 hover:text-black transition-colors"
          >
            + Add another sample
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {success && (
        <div className="text-sm text-green-700">
          Voice profile created. It appears above.
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !name.trim() || totalWords < 100}
        className="h-11 px-6 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Analyzing your voice..." : "Create voice profile"}
      </button>

      <p className="text-xs text-neutral-400">
        Samples stay in your account and can be deleted any time.
      </p>
    </form>
  );
}
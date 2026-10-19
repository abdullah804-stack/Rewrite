"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { analyzeSample } from "@/lib/pipeline/coach";
import { AVATARS, Avatar, type AvatarId } from "@/lib/avatars";

export function NewProfileForm({ disabled }: { disabled: boolean }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("minimalist");
  const [samples, setSamples] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const combinedText = samples.join("\n\n");
  const totalWords = combinedText.trim().split(/\s+/).filter(Boolean).length;
  
  const coach = useMemo(() => analyzeSample(combinedText), [combinedText]);

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
          avatar,
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
      setAvatar("minimalist");
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
      <div className="mt-4 p-5 sm:p-6 rounded-2xl border border-surface-border bg-surface-raised text-sm text-text-secondary">
        Free plan allows 3 voice profiles. Delete one to create another.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 sm:gap-8">
        
        {/* Left: Inputs */}
        <div className="space-y-6 sm:space-y-8">
          
          {/* Avatar Picker */}
          <div>
            <label className="text-xs sm:text-sm font-bold text-text-primary uppercase tracking-wide mb-3 block">
              Choose a persona
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {AVATARS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAvatar(a.id)}
                  className={`flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl border-2 transition-all ${
                    avatar === a.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-surface-border bg-surface-base hover:border-brand-300"
                  }`}
                >
                  <Avatar id={a.id} className="w-8 h-8 sm:w-10 sm:h-10" />
                  <span className={`text-[10px] sm:text-xs font-semibold text-center ${avatar === a.id ? "text-brand-700" : "text-text-secondary"}`}>
                    {a.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs sm:text-sm font-bold text-text-primary uppercase tracking-wide">
              Profile name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My blog voice"
              className="mt-2 w-full h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-surface-border bg-surface-base text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand-500 transition-colors shadow-sm"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-bold text-text-primary uppercase tracking-wide">
                Writing samples
              </label>
              <span className={`text-[11px] sm:text-xs font-medium ${totalWords < 100 ? 'text-red-500' : 'text-text-secondary'}`}>
                {totalWords} words (min 100)
              </span>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {samples.map((sample, i) => (
                <div key={i} className="relative group">
                  <textarea
                    value={sample}
                    onChange={(e) => updateSample(i, e.target.value)}
                    placeholder={`Sample ${i + 1} — paste 150+ words you wrote`}
                    rows={5}
                    className="w-full p-3 sm:p-4 rounded-xl border border-surface-border bg-surface-base text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand-500 resize-none shadow-sm transition-colors"
                  />
                  {samples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSample(i)}
                      className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[10px] sm:text-xs font-medium text-text-secondary hover:text-red-500 bg-surface-base/80 px-2 py-1 rounded transition-colors"
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
                className="mt-3 text-xs sm:text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                + Add another sample
              </button>
            )}
          </div>
        </div>

        {/* Right: Voice Coach */}
        <div>
          <div className="sticky top-20 sm:top-24 p-5 sm:p-6 rounded-2xl bg-surface-raised border border-surface-border shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Avatar id={avatar} className="w-6 h-6 sm:w-8 sm:h-8" />
                <span className="text-sm sm:text-base font-bold text-text-primary">Voice Coach</span>
              </div>
              <span className={`text-xs sm:text-sm font-bold ${coach.score >= 80 ? 'text-green-600' : coach.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {coach.score}/100
              </span>
            </div>
            
            <div className="h-1.5 sm:h-2 w-full bg-surface-border rounded-full overflow-hidden mb-4 sm:mb-6">
              <div
                className={`h-full rounded-full transition-all duration-500 ${coach.score >= 80 ? 'bg-green-500' : coach.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${coach.score}%` }}
              />
            </div>

            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-text-secondary">
              {coach.feedback.map((f, i) => (
                <li key={i} className="leading-relaxed flex gap-2 sm:gap-3">
                  <span className="text-brand-600 shrink-0 mt-0.5">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-surface-border">
        {error && (
          <div className="text-xs sm:text-sm text-red-600 mb-3 sm:mb-4 font-medium">{error}</div>
        )}

        {success && (
          <div className="text-xs sm:text-sm text-green-600 mb-3 sm:mb-4 font-medium">
            Voice profile created. It appears above.
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim() || totalWords < 100}
          className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:bg-surface-border disabled:text-text-secondary disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
        >
          {loading ? "Analyzing your voice..." : "Create voice profile"}
        </button>
      </div>
    </form>
  );
}
"use client";

import { useState } from "react";

type Comment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
};

export function ReviewClient({
  slug,
  original,
  rewritten,
  initialComments,
}: {
  slug: string;
  original: string;
  rewritten: string;
  initialComments: any[];
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/share/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: name, content }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setComments([...comments, data.comment]);
        setContent("");
      }
    } catch (err) {
      alert("Failed to post comment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Text Area */}
      <div className="flex-1 w-full space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-text-secondary dark:text-text-dark-secondary uppercase tracking-widest">Original Draft</h2>
            <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-full border border-red-100 dark:border-red-900/30">Before</span>
          </div>
          <div className="p-6 sm:p-8 rounded-3xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised text-base whitespace-pre-wrap leading-relaxed text-text-secondary dark:text-text-dark-secondary shadow-sm">
            {original || "No original text provided."}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-text-secondary dark:text-text-dark-secondary uppercase tracking-widest">Rewritten Version</h2>
            <span className="text-xs font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-500/20">After</span>
          </div>
          <div className="p-6 sm:p-8 rounded-3xl border-2 border-brand-500 bg-surface-base dark:bg-surface-dark-base text-base whitespace-pre-wrap leading-relaxed text-text-primary dark:text-white shadow-lg shadow-brand-500/10">
            {rewritten || "No rewritten text provided."}
          </div>
        </div>
      </div>

      {/* Comments Sidebar */}
      <div className="w-full lg:w-96 shrink-0 bg-surface-raised dark:bg-surface-dark-raised rounded-3xl border border-surface-border dark:border-surface-dark-border p-6 shadow-sm">
        <h2 className="text-lg font-bold text-text-primary dark:text-white mb-4">Review Comments</h2>
        
        <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
          {comments.length === 0 && (
            <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary italic p-4 rounded-xl bg-surface-base dark:bg-surface-dark-base border border-surface-border dark:border-surface-dark-border text-center">No comments yet. Be the first to review.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="p-4 rounded-xl border border-surface-border dark:border-surface-dark-border bg-surface-base dark:bg-surface-dark-base text-sm shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-text-primary dark:text-white">{c.authorName}</span>
                <span className="text-[10px] font-bold text-text-secondary dark:text-text-dark-secondary bg-surface-raised dark:bg-surface-dark-raised px-2 py-1 rounded">
                  {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-text-secondary dark:text-text-dark-secondary leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-surface-border dark:border-surface-dark-border">
          <div>
            <label className="block text-xs font-bold text-text-primary dark:text-white uppercase tracking-widest mb-2">Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-surface-border dark:border-surface-dark-border bg-surface-base dark:bg-surface-dark-base text-sm text-text-primary dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="e.g. Alex"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-primary dark:text-white uppercase tracking-widest mb-2">Comment</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-lg border border-surface-border dark:border-surface-dark-border bg-surface-base dark:bg-surface-dark-base text-sm text-text-primary dark:text-white focus:outline-none focus:border-brand-500 resize-none transition-colors"
              placeholder="Leave feedback..."
            />
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim() || !content.trim()}
            className="w-full h-10 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:bg-surface-border dark:disabled:bg-surface-dark-border disabled:text-text-secondary dark:disabled:text-text-dark-secondary transition-colors shadow-sm"
          >
            {loading ? "Posting..." : "Post comment"}
          </button>
        </form>
      </div>
    </div>
  );
}
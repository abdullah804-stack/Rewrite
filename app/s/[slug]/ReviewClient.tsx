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
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded">Before</span>
          </div>
          <div className="p-6 rounded-2xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised text-sm whitespace-pre-wrap leading-relaxed text-text-secondary dark:text-text-dark-secondary shadow-sm">
            {original || "No original text provided."}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-text-secondary dark:text-text-dark-secondary uppercase tracking-widest">Rewritten Version</h2>
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-1 rounded">After</span>
          </div>
          <div className="p-6 rounded-2xl border-2 border-brand-500 bg-surface-base dark:bg-surface-dark-base text-sm whitespace-pre-wrap leading-relaxed text-text-primary dark:text-white shadow-md">
            {rewritten || "No rewritten text provided."}
          </div>
        </div>
      </div>

      {/* Comments Sidebar */}
      <div className="w-full lg:w-96 shrink-0">
        <h2 className="text-xs font-bold text-text-secondary dark:text-text-dark-secondary uppercase tracking-widest mb-3">Comments</h2>
        
        <div className="space-y-3 mb-6 max-h-[500px] overflow-y-auto pr-2">
          {comments.length === 0 && (
            <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary italic p-4 rounded-xl bg-surface-raised dark:bg-surface-dark-raised border border-surface-border dark:border-surface-dark-border text-center">No comments yet. Be the first to review.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="p-4 rounded-xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised text-sm shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-text-primary dark:text-white">{c.authorName}</span>
                <span className="text-[10px] font-medium text-text-secondary dark:text-text-dark-secondary bg-surface-base dark:bg-surface-dark-base px-2 py-0.5 rounded border border-surface-border dark:border-surface-dark-border">
                  {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-text-secondary dark:text-text-dark-secondary leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5 rounded-2xl border border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised shadow-sm">
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
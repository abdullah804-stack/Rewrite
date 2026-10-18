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
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Text Area */}
      <div className="flex-1 space-y-8">
        <div>
          <h2 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">Original Draft</h2>
          <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm whitespace-pre-wrap leading-relaxed text-neutral-600 dark:text-neutral-400">
            {original || "No original text provided."}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-medium text-green-700 dark:text-green-500 uppercase tracking-wide mb-3">Rewritten Version</h2>
          <div className="p-4 rounded-lg border border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/20 text-sm whitespace-pre-wrap leading-relaxed text-black dark:text-white">
            {rewritten || "No rewritten text provided."}
          </div>
        </div>
      </div>

      {/* Comments Sidebar */}
      <div className="w-full lg:w-80 shrink-0">
        <h2 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">Comments</h2>
        
        <div className="space-y-3 mb-6 max-h-[500px] overflow-y-auto pr-2">
          {comments.length === 0 && (
            <p className="text-sm text-neutral-400 dark:text-neutral-500 italic">No comments yet. Be the first to review.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-black dark:text-white">{c.authorName}</span>
                <span className="text-[10px] text-neutral-400">
                  {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-8 px-2 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs focus:outline-none focus:border-neutral-400"
              placeholder="e.g. Alex"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Comment</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full p-2 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs focus:outline-none focus:border-neutral-400 resize-none"
              placeholder="Leave feedback..."
            />
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim() || !content.trim()}
            className="w-full h-8 rounded bg-black dark:bg-white text-white dark:text-black text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:bg-neutral-300 transition-colors"
          >
            {loading ? "Posting..." : "Post comment"}
          </button>
        </form>
      </div>
    </div>
  );
}
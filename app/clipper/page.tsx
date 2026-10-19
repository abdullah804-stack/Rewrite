import Link from "next/link";

const BOOKMARKLET_CODE = `javascript:(function(){var t=window.getSelection().toString()||document.body.innerText.slice(0,1500);if(!t.trim()){alert('Please highlight some text first.');return;}var u=window.location.origin.includes('localhost')?'http://localhost:3000':'https://rewrite-green.vercel.app';window.open(u+'/quick?text='+encodeURIComponent(t),'_blank');})();`;

export default function ClipperPage() {
  return (
    <main className="min-h-screen bg-surface-base dark:bg-surface-dark-base text-text-primary dark:text-text-dark-primary transition-colors">
      <header className="border-b border-surface-border dark:border-surface-dark-border sticky top-0 bg-surface-base/80 dark:bg-surface-dark-base/80 backdrop-blur-md z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
              R
            </div>
            Rewrite
          </Link>
          <Link
            href="/quick"
            className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-brand-600 dark:hover:text-brand-500 transition-colors"
          >
            Quick rewrite
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary dark:text-white mb-4">
          Web Clipper
        </h1>
        <p className="text-lg text-text-secondary dark:text-text-dark-secondary mb-10 max-w-xl leading-relaxed">
          Rewrite text on any website without copy-pasting. Drag the button below to your browser&apos;s bookmarks bar. 
          Then, just highlight text anywhere on the web and click the bookmark.
        </p>

        <div className="p-10 rounded-3xl border-2 border-dashed border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised flex flex-col items-center justify-center text-center mb-12">
          <a
            href={BOOKMARKLET_CODE}
            className="inline-block px-8 py-4 rounded-xl bg-brand-600 text-white text-lg font-bold shadow-md hover:bg-brand-700 transition-all cursor-grab active:cursor-grabbing hover:-translate-y-1"
            title="Drag me to your bookmarks bar"
          >
            Rewrite This Text
          </a>
          <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary mt-4">
            ↑ Drag this button to your bookmarks bar ↑
          </p>
        </div>

        <div className="space-y-8 text-base text-text-secondary dark:text-text-dark-secondary">
          <h2 className="text-2xl font-bold text-text-primary dark:text-white border-b border-surface-border dark:border-surface-dark-border pb-2">How to install</h2>
          
          <div>
            <strong className="text-text-primary dark:text-white block mb-1 text-lg">1. Show your bookmarks bar</strong>
            <p>In Chrome: Cmd+Shift+B (Mac) or Ctrl+Shift+B (Windows). In Safari: Cmd+Shift+B.</p>
          </div>

          <div>
            <strong className="text-text-primary dark:text-white block mb-1 text-lg">2. Drag the button</strong>
            <p>Click and hold the orange &quot;Rewrite This Text&quot; button above, drag it up to your bookmarks bar, and release.</p>
          </div>

          <div>
            <strong className="text-text-primary dark:text-white block mb-1 text-lg">3. Use it anywhere</strong>
            <p>Go to LinkedIn, Twitter, or any blog. Highlight a paragraph of text, then click the &quot;Rewrite This Text&quot; bookmark. It will open a new tab with your text pre-loaded in the workspace.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
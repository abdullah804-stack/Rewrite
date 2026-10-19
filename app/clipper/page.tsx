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
        <div className="max-w-2xl mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-text-primary dark:text-white mb-4">
            Web Clipper
          </h1>
          <p className="text-lg text-text-secondary dark:text-text-dark-secondary leading-relaxed">
            Rewrite text on any website without copy-pasting. Drag the button below to your browser&apos;s bookmarks bar. 
            Then, just highlight text anywhere on the web and click the bookmark.
          </p>
        </div>

        {/* Drag & Drop Zone */}
        <div className="p-10 sm:p-16 rounded-3xl border-2 border-dashed border-surface-border dark:border-surface-dark-border bg-surface-raised dark:bg-surface-dark-raised flex flex-col items-center justify-center text-center mb-16 relative overflow-hidden group hover:border-brand-500 dark:hover:border-brand-500 transition-colors">
          <div className="absolute inset-0 bg-brand-50/50 dark:bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="relative z-10">
            <a
              href={BOOKMARKLET_CODE}
              className="inline-block px-8 py-4 rounded-xl bg-brand-600 text-white text-lg font-bold shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:shadow-xl"
              title="Drag me to your bookmarks bar"
            >
              Rewrite This Text
            </a>
            <p className="text-sm font-semibold text-text-secondary dark:text-text-dark-secondary mt-6 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
              Drag this button to your bookmarks bar
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-10 text-base text-text-secondary dark:text-text-dark-secondary">
          <h2 className="text-2xl font-bold text-text-primary dark:text-white border-b border-surface-border dark:border-surface-dark-border pb-3">
            How to install
          </h2>
          
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold shrink-0">1</div>
            <div>
              <strong className="text-text-primary dark:text-white block mb-1 text-lg">Show your bookmarks bar</strong>
              <p className="leading-relaxed">In Chrome: Cmd+Shift+B (Mac) or Ctrl+Shift+B (Windows). In Safari: Cmd+Shift+B.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold shrink-0">2</div>
            <div>
              <strong className="text-text-primary dark:text-white block mb-1 text-lg">Drag the button</strong>
              <p className="leading-relaxed">Click and hold the orange &quot;Rewrite This Text&quot; button above, drag it up to your bookmarks bar, and release.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold shrink-0">3</div>
            <div>
              <strong className="text-text-primary dark:text-white block mb-1 text-lg">Use it anywhere</strong>
              <p className="leading-relaxed">Go to LinkedIn, Twitter, or any blog. Highlight a paragraph of text, then click the &quot;Rewrite This Text&quot; bookmark. It will open a new tab with your text pre-loaded in the workspace.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
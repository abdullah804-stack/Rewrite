import Link from "next/link";

const BOOKMARKLET_CODE = `javascript:(function(){var t=window.getSelection().toString()||document.body.innerText.slice(0,1500);if(!t.trim()){alert('Please highlight some text first.');return;}var u=window.location.origin.includes('localhost')?'http://localhost:3000':'https://rewrite-green.vercel.app';window.open(u+'/quick?text='+encodeURIComponent(t),'_blank');})();`;

export default function ClipperPage() {
  return (
    <main className="min-h-screen bg-surface-base text-text-primary transition-colors">
      <header className="border-b border-surface-border sticky top-0 bg-surface-base/90 backdrop-blur-md z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs sm:text-sm font-black shadow-sm">
              R
            </div>
            <span className="hidden sm:inline">Rewrite</span>
          </Link>
          <Link
            href="/quick"
            className="text-xs sm:text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors"
          >
            Quick rewrite
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-20">
        <div className="max-w-2xl mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-3 sm:mb-4">
            Web Clipper
          </h1>
          <p className="text-sm sm:text-lg text-text-secondary leading-relaxed">
            Rewrite text on any website without copy-pasting. Drag the button below to your browser&apos;s bookmarks bar. 
            Then, just highlight text anywhere on the web and click the bookmark.
          </p>
        </div>

        <div className="p-6 sm:p-16 rounded-2xl sm:rounded-3xl border-2 border-dashed border-surface-border bg-surface-raised flex flex-col items-center justify-center text-center mb-10 sm:mb-16 relative overflow-hidden group hover:border-brand-500 transition-colors">
          <div className="absolute inset-0 bg-brand-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="relative z-10 w-full flex flex-col items-center">
            <a
              href={BOOKMARKLET_CODE}
              className="inline-block px-5 py-3 sm:px-8 sm:py-4 rounded-xl bg-brand-600 text-white text-base sm:text-lg font-bold shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:shadow-xl"
              title="Drag me to your bookmarks bar"
            >
              Rewrite This Text
            </a>
            <p className="text-xs sm:text-sm font-semibold text-text-secondary mt-4 sm:mt-6 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
              Drag this button to your bookmarks bar
            </p>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-10 text-sm sm:text-base text-text-secondary">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary border-b border-surface-border pb-2 sm:pb-3">
            How to install
          </h2>
          
          <div className="flex gap-3 sm:gap-4">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold shrink-0 text-sm sm:text-base">1</div>
            <div>
              <strong className="text-text-primary block mb-0.5 sm:mb-1 text-base sm:text-lg">Show your bookmarks bar</strong>
              <p className="leading-relaxed">In Chrome: Cmd+Shift+B (Mac) or Ctrl+Shift+B (Windows). In Safari: Cmd+Shift+B.</p>
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold shrink-0 text-sm sm:text-base">2</div>
            <div>
              <strong className="text-text-primary block mb-0.5 sm:mb-1 text-base sm:text-lg">Drag the button</strong>
              <p className="leading-relaxed">Click and hold the orange &quot;Rewrite This Text&quot; button above, drag it up to your bookmarks bar, and release.</p>
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold shrink-0 text-sm sm:text-base">3</div>
            <div>
              <strong className="text-text-primary block mb-0.5 sm:mb-1 text-base sm:text-lg">Use it anywhere</strong>
              <p className="leading-relaxed">Go to LinkedIn, Twitter, or any blog. Highlight a paragraph of text, then click the &quot;Rewrite This Text&quot; bookmark. It will open a new tab with your text pre-loaded in the workspace.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
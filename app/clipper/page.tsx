import Link from "next/link";

const BOOKMARKLET_CODE = `javascript:(function(){var t=window.getSelection().toString()||document.body.innerText.slice(0,1500);if(!t.trim()){alert('Please highlight some text first.');return;}var u=window.location.origin.includes('localhost')?'http://localhost:3000':'https://rewrite-green.vercel.app';window.open(u+'/quick?text='+encodeURIComponent(t),'_blank');})();`;

export default function ClipperPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-black">
            Rewrite
          </Link>
          <Link
            href="/quick"
            className="text-sm text-neutral-500 hover:text-black transition-colors"
          >
            Quick rewrite
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-semibold text-black mb-4">
          Web Clipper
        </h1>
        <p className="text-base text-neutral-500 mb-8 max-w-xl leading-relaxed">
          Rewrite text on any website without copy-pasting. Drag the button below to your browser&apos;s bookmarks bar. 
          Then, just highlight text anywhere on the web and click the bookmark.
        </p>

        <div className="p-8 rounded-xl border border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center text-center">
          <a
            href={BOOKMARKLET_CODE}
            className="inline-block px-6 py-3 rounded-lg bg-black text-white font-medium shadow-sm hover:bg-neutral-800 transition-colors cursor-grab active:cursor-grabbing"
            title="Drag me to your bookmarks bar"
          >
            Rewrite This Text
          </a>
          <p className="text-sm text-neutral-500 mt-4">
            ↑ Drag this button to your bookmarks bar ↑
          </p>
        </div>

        <div className="mt-12 space-y-6 text-sm text-neutral-600">
          <h2 className="text-lg font-medium text-black">How to install</h2>
          
          <div>
            <strong className="text-black block mb-1">1. Show your bookmarks bar</strong>
            <p>In Chrome: Cmd+Shift+B (Mac) or Ctrl+Shift+B (Windows). In Safari: Cmd+Shift+B.</p>
          </div>

          <div>
            <strong className="text-black block mb-1">2. Drag the button</strong>
            <p>Click and hold the black &quot;Rewrite This Text&quot; button above, drag it up to your bookmarks bar, and release.</p>
          </div>

          <div>
            <strong className="text-black block mb-1">3. Use it anywhere</strong>
            <p>Go to LinkedIn, Twitter, or any blog. Highlight a paragraph of text, then click the &quot;Rewrite This Text&quot; bookmark. It will open a new tab with your text pre-loaded in the workspace.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
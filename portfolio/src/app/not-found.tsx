import Link from "next/link";

// ─── Seed URL support for creative demos ─────────────────────────────
// Demos have shareable URLs like /creative/sakura/qualuo/ and
// /creative/embers/qualuo/. Since this is a static export (GitHub Pages),
// those paths don't have pre-rendered HTML — they hit this 404 page.
// The inline script detects seed URLs, stashes the seed in sessionStorage,
// and redirects to the base demo page where the client picks it up.
// Non-demo 404s are unaffected — they just see the normal 404 UI.
// ─────────────────────────────────────────────────────────────────────

export default function NotFound() {
  return (
    <>
      {/* Seed URL redirects — see comment above */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var p=window.location.pathname;var m;m=p.match(/^\\/creative\\/sakura\\/([^/]+)/);if(m&&m[1]){sessionStorage.setItem('sakura-seed',decodeURIComponent(m[1]));window.location.replace('/creative/sakura/');return;}m=p.match(/^\\/creative\\/embers\\/([^/]+)/);if(m&&m[1]){sessionStorage.setItem('embers-seed',decodeURIComponent(m[1]));window.location.replace('/creative/embers/');}})()`,
        }}
      />
      <main
        id="main-content"
        className="flex flex-col items-center justify-center min-h-screen gap-4"
      >
        <h1 className="text-4xl font-light text-neutral-800">404</h1>
        <p className="text-neutral-500">This page doesn&apos;t exist.</p>
        <Link
          href="/"
          className="text-neutral-400 hover:text-neutral-600 transition-colors text-sm"
        >
          Go home
        </Link>
      </main>
    </>
  );
}

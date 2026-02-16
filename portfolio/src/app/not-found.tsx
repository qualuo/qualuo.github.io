import Link from "next/link";

// ─── Sakura seed URL support ─────────────────────────────────────────
// Sakura trees have shareable URLs like /creative/sakura/qualuo/.
// Since this is a static export (GitHub Pages), those paths don't have
// pre-rendered HTML files — they hit this 404 page instead.
// The inline script below detects sakura seed URLs, stashes the seed
// in sessionStorage, and redirects to /creative/sakura/ where
// SakuraClient picks it up and restores the full URL via replaceState.
// Non-sakura 404s are unaffected — they just see the normal 404 UI.
// ─────────────────────────────────────────────────────────────────────

export default function NotFound() {
  return (
    <>
      {/* Sakura seed redirect — see comment above */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var m=window.location.pathname.match(/^\\/creative\\/sakura\\/([^/]+)/);if(m&&m[1]){sessionStorage.setItem('sakura-seed',decodeURIComponent(m[1]));window.location.replace('/creative/sakura/')}})()`,
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

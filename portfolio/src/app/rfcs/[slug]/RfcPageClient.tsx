"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Rfc, rfcLabel } from "@/lib/rfcs";
import { Navbar } from "@/components/layout/Navbar";

interface RfcPageClientProps {
  rfc: Rfc | undefined;
  content: string;
}

export function RfcPageClient({ rfc, content }: RfcPageClientProps) {
  if (!rfc) {
    return (
      <main className="relative min-h-screen flex items-center justify-center">

        <div className="text-center">
          <h1 className="text-4xl font-light tracking-tight text-white mb-4">
            RFC Not Found
          </h1>
          <Link
            href="/rfcs"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/6 text-slate-300 font-light hover:bg-white/10 transition-colors border border-white/6"
          >
            Back to RFCs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh">

      <Navbar isSubpage hasStars={false} />

      {/* Header */}
      <header className="relative pt-32 pb-16 px-6 text-center max-w-3xl mx-auto">
        <p className="text-xs font-mono font-medium tracking-[0.3em] uppercase mb-6 text-slate-500">
          {rfcLabel(rfc)}
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 leading-tight">
          <span
            className={`bg-linear-to-r ${rfc.gradient} bg-clip-text text-transparent`}
          >
            {rfc.title}
          </span>
        </h1>
        <p className="text-slate-400 text-lg font-light">{rfc.subtitle}</p>
      </header>

      {/* Markdown body */}
      <article className="max-w-3xl mx-auto px-6 lg:px-10 pb-24">
        <div className="rfc-prose prose prose-invert prose-lg max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      </article>

      {/* Footer */}
      <div className="py-16 max-w-3xl mx-auto px-6 text-center">
        <div className="h-px bg-linear-to-r from-transparent via-white/10 to-transparent mb-12" />
        <Link
          href="/rfcs"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/6 text-slate-300 font-light hover:bg-white/10 transition-colors border border-white/6"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16l-4-4m0 0l4-4m-4 4h18"
            />
          </svg>
          Back to RFCs
        </Link>
      </div>
    </main>
  );
}

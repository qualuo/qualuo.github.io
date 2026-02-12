"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";
import { rfcs, rfcLabel, Rfc } from "@/lib/rfcs";
import { Navbar } from "@/components/layout/Navbar";

/* ── Blueprint Grid Background ───────────────────────────────── */

function BlueprintGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    const CELL = 48;
    const SUB = 12;

    const draw = () => {
      time += 0.003;
      ctx.clearRect(0, 0, w(), h());

      const width = w();
      const height = h();

      // Sub-grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += SUB) {
        if (x % CELL === 0) continue;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += SUB) {
        if (y % CELL === 0) continue;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Major grid lines with breathing opacity
      const cols = Math.ceil(width / CELL);
      const rows = Math.ceil(height / CELL);

      for (let i = 0; i <= cols; i++) {
        const x = i * CELL;
        const phase = Math.sin(time + i * 0.4) * 0.5 + 0.5;
        const alpha = 0.03 + phase * 0.03;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let j = 0; j <= rows; j++) {
        const y = j * CELL;
        const phase = Math.sin(time + j * 0.4 + 1.5) * 0.5 + 0.5;
        const alpha = 0.03 + phase * 0.03;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Intersection dots at major crossings
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = i * CELL;
          const y = j * CELL;
          const phase = Math.sin(time * 1.5 + i * 0.3 + j * 0.3) * 0.5 + 0.5;
          const alpha = 0.04 + phase * 0.06;
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}

/* ── Icons ────────────────────────────────────────────────────── */

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const RFC_ICONS: Record<string, React.ReactNode> = {
  "cloud-cog": (
    <svg className="w-6 h-6" viewBox="0 0 24 24" {...S}>
      <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9" />
      <circle cx="12" cy="17" r="3" />
      <path d="M12 13v1" />
      <path d="M12 20v1" />
      <path d="M16 17h-1" />
      <path d="M9 17H8" />
    </svg>
  ),
  "globe-lock": (
    <svg className="w-6 h-6" viewBox="0 0 24 24" {...S}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20" />
      <path d="M12 2a14.5 14.5 0 0 1 0 20" />
      <path d="M2 12h20" />
      <rect x="16" y="16" width="6" height="5" rx="1" />
      <path d="M17 16v-1a2 2 0 0 1 4 0v1" />
    </svg>
  ),
  "brain-circuit": (
    <svg className="w-6 h-6" viewBox="0 0 24 24" {...S}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 1 .399 1.375" />
      <path d="M6.003 5.125A3 3 0 0 1 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  ),
};

/* ── Card ─────────────────────────────────────────────────────── */

function RfcCard({ rfc }: { rfc: Rfc }) {
  return (
    <Link
      href={`/rfcs/${rfc.slug}`}
      className="group relative block rounded-2xl overflow-hidden"
    >
      {/* Subtle gradient background glow on hover */}
      <div
        className={`absolute inset-0 bg-linear-to-br ${rfc.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`}
      />

      <div className="relative p-7 border border-white/6 rounded-2xl bg-[#1c1c1c] group-hover:bg-[#202020] group-hover:border-white/10 transition-all duration-300">
        {/* Top row: icon + date */}
        <div className="flex items-center justify-between mb-5">
          <div
            className={`w-11 h-11 rounded-xl bg-linear-to-br ${rfc.gradient} flex items-center justify-center text-white/90 shadow-lg`}
          >
            {RFC_ICONS[rfc.icon] || null}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="font-mono tracking-wide">{rfcLabel(rfc)}</span>
            <span className="text-slate-600">·</span>
            <span>{rfc.sectionCount} sections</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl text-white font-medium mb-2 group-hover:text-white/90 transition-colors">
          {rfc.title}
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-slate-400 font-light leading-relaxed mb-4">
          {rfc.subtitle}
        </p>

        {/* Description */}
        <p className="text-sm text-slate-500 leading-relaxed mb-5">
          {rfc.description}
        </p>

        {/* Tags + arrow */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {rfc.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-xs text-slate-500 border border-white/5 rounded-md group-hover:border-white/8 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
          <svg
            className="w-5 h-5 shrink-0 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function RfcListPageClient() {
  const liveRfcs = rfcs
    .filter((r) => r.status === "live")
    .sort((a, b) => b.number - a.number);

  return (
    <main id="main-content" className="relative min-h-screen">
      <BlueprintGrid />
      <Navbar isSubpage hasStars={false} />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-28 md:pt-40 pb-20 md:pb-32">
        {/* Header */}
        <h1 className="text-3xl font-light tracking-tight text-white mb-3">
          Requests for Comments
        </h1>
        <p className="text-slate-500 font-light mb-16">
          Structured proposals for architecture decisions
        </p>

        {/* Cards */}
        <div className="grid gap-5">
          {liveRfcs.map((rfc) => (
            <RfcCard key={rfc.slug} rfc={rfc} />
          ))}
        </div>
      </div>
    </main>
  );
}

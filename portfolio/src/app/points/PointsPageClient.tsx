"use client";

import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import Link from "next/link";
import { points, Point } from "@/lib/points";
import { Navbar } from "@/components/layout/Navbar";
import { DelicateAccent } from "@/components/animations/DelicateAccent";
import { DrawSvg } from "@/components/points/shared/DrawSvg";
import { useRef } from "react";

const ease = [0.23, 1, 0.32, 1] as const;

// ──────────────────────────────────────────────
// Point Icons (stroke-based, currentColor)
// ──────────────────────────────────────────────

const POINT_ICONS: Record<string, React.ReactNode> = {
  landmark: (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
      <line x1="2" y1="18" x2="22" y2="18" />
    </svg>
  ),
  shuffle: (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h5v5" />
      <path d="M4 20L21 3" />
      <path d="M21 16v5h-5" />
      <path d="M15 15l6 6" />
      <path d="M4 4l5 5" />
    </svg>
  ),
  cpu: (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  ),
  code: (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  network: (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
      <circle cx="12" cy="12" r="2" />
      <line x1="8" y1="7" x2="10" y2="10" />
      <line x1="16" y1="7" x2="14" y2="10" />
      <line x1="8" y1="17" x2="10" y2="14" />
      <line x1="16" y1="17" x2="14" y2="14" />
    </svg>
  ),
  cloud: (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19H9a7 7 0 116.71-9h1.79a4.5 4.5 0 010 9z" />
    </svg>
  ),
};

// ──────────────────────────────────────────────
// Cursor Glow Colors (rgb values per point)
// ──────────────────────────────────────────────

const GLOW_COLORS: Record<string, string> = {
  "ai-architecture": "167,139,250",
  "system-landscape": "20,184,166",
  togaf: "245,158,11",
};

// ──────────────────────────────────────────────
// Authority Metadata
// ──────────────────────────────────────────────

const POINT_META: Record<string, { time: string; audience: string }> = {
  "ai-architecture": { time: "12 min read", audience: "Technical Leaders" },
  "system-landscape": { time: "10 min", audience: "CxOs & Architects" },
  togaf: { time: "8 min", audience: "Enterprise Architects" },
};

// ──────────────────────────────────────────────
// Mini Diagram Thumbnails
// ──────────────────────────────────────────────

const THUMBNAILS: Record<string, React.ReactNode> = {
  "ai-architecture": (
    <svg viewBox="0 0 80 60" className="w-full h-full" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={5}
          y={2 + i * 12}
          width={70}
          height={9}
          rx={2}
          fill={`rgba(167,139,250,${0.15 - i * 0.025})`}
          stroke={`rgba(167,139,250,${0.3 - i * 0.04})`}
          strokeWidth={0.5}
        />
      ))}
    </svg>
  ),
  "system-landscape": (
    <svg viewBox="0 0 80 40" className="w-full h-full" aria-hidden="true">
      <line x1="22" y1="20" x2="30" y2="20" stroke="rgba(20,184,166,0.3)" strokeWidth="0.5" />
      <line x1="50" y1="20" x2="58" y2="20" stroke="rgba(20,184,166,0.3)" strokeWidth="0.5" />
      <rect x="2" y="12" width="20" height="16" rx="3" fill="rgba(20,184,166,0.1)" stroke="rgba(20,184,166,0.25)" strokeWidth="0.5" />
      <rect x="30" y="8" width="20" height="24" rx="3" fill="rgba(20,184,166,0.15)" stroke="rgba(20,184,166,0.35)" strokeWidth="0.5" />
      <rect x="58" y="12" width="20" height="16" rx="3" fill="rgba(20,184,166,0.1)" stroke="rgba(20,184,166,0.25)" strokeWidth="0.5" />
    </svg>
  ),
  togaf: (
    <svg viewBox="0 0 60 60" className="w-full h-full" aria-hidden="true">
      <circle cx="30" cy="30" r="20" fill="none" stroke="rgba(245,158,11,0.2)" strokeWidth="1" strokeDasharray="4 3" />
      <circle cx="30" cy="30" r="8" fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.2)" strokeWidth="0.5" />
      <polygon points="30,8 33,14 27,14" fill="rgba(245,158,11,0.3)" />
      <polygon points="52,30 46,33 46,27" fill="rgba(245,158,11,0.3)" />
      <polygon points="30,52 27,46 33,46" fill="rgba(245,158,11,0.3)" />
      <polygon points="8,30 14,27 14,33" fill="rgba(245,158,11,0.3)" />
    </svg>
  ),
};


// ──────────────────────────────────────────────
// Point Card
// ──────────────────────────────────────────────

type CardVariant = "featured" | "standard" | "compact";

function PointCard({ point, index, variant = "standard" }: { point: Point; index: number; variant?: CardVariant }) {
  const isComingSoon = point.status === "coming-soon";
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";
  const isPaper = point.format === "paper";
  const isSlides = point.format === "slides" || !point.format;
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowRgb = GLOW_COLORS[point.slug] || "255,255,255";
  const glow = useMotionTemplate`radial-gradient(900px circle at ${mouseX}px ${mouseY}px, rgba(${glowRgb}, 0.09), transparent 50%)`;

  function onMove(e: React.MouseEvent) {
    if (!cardRef.current) return;
    const { left, top } = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }

  const num = String(index + 1).padStart(2, "0");
  const meta = POINT_META[point.slug];
  const thumb = THUMBNAILS[point.slug];

  const padding = isFeatured
    ? "p-8 md:p-14"
    : isCompact
      ? "p-5 md:p-7"
      : "p-6 md:p-10";

  const titleSize = isFeatured
    ? "text-3xl md:text-4xl"
    : isCompact
      ? "text-xl md:text-2xl"
      : "text-2xl md:text-3xl";

  const numSize = isFeatured
    ? "text-[100px] md:text-[160px]"
    : isCompact
      ? "text-[60px] md:text-[80px]"
      : "text-[80px] md:text-[120px]";

  const iconSize = isFeatured ? "w-16 h-16 rounded-2xl" : "w-14 h-14 rounded-xl";
  const iconRound = isFeatured ? "rounded-2xl" : "rounded-xl";

  return (
    <Link
      href={isComingSoon ? "#" : `/points/${point.slug}`}
      className={`group block h-full ${isComingSoon ? "cursor-default" : ""}`}
      onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
    >
      <motion.div
        className="relative h-full"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, delay: index * 0.15, ease }}
      >
        {/* Slides: stacked deck layers */}
        {isSlides && !isComingSoon && (
          <>
            <div className="absolute inset-0 rounded-2xl border border-white/4 translate-x-2 translate-y-2 pointer-events-none" />
            <div className="absolute inset-0 rounded-2xl border border-white/5 translate-x-1 translate-y-1 pointer-events-none" />
          </>
        )}

        <div
          ref={cardRef}
          onMouseMove={!isComingSoon ? onMove : undefined}
          className={`
            relative overflow-hidden rounded-2xl h-full
            border border-white/8 bg-white/[0.035]
            transition-all duration-500 ease-out
            ${padding}
            ${!isComingSoon ? "group-hover:border-white/14 group-hover:bg-white/6" : ""}
          `}
        >
          {/* Cursor-following glow */}
          {!isComingSoon && (
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: glow }}
            />
          )}

          {/* Paper: corner fold */}
          {isPaper && !isComingSoon && (
            <svg className="absolute top-0 right-0 w-8 h-8 pointer-events-none z-10" viewBox="0 0 32 32">
              <path d="M0 0 L32 0 L32 32 Z" fill="rgba(255,255,255,0.07)" />
              <path d="M0 0 L32 32" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
            </svg>
          )}

          {/* Decorative number */}
          {!isCompact && (
            <span className={`absolute top-4 right-6 font-extralight leading-none text-white/3 pointer-events-none select-none ${numSize}`}>
              {num}
            </span>
          )}

          {/* Theme gradient accent — vertical spine */}
          <div className={`absolute top-0 left-0 bottom-0 w-1 bg-linear-to-b ${point.gradient} opacity-40 ${!isComingSoon ? "group-hover:opacity-70" : ""} transition-opacity duration-500`} />

          <div className={`flex ${isCompact ? "flex-col gap-4" : "flex-col md:flex-row md:items-start gap-6 md:gap-12"}`}>
            {/* Icon */}
            <div className="shrink-0">
              <div className={`relative ${isCompact ? "w-12 h-12 rounded-xl" : iconSize} bg-white/4 border border-white/6 flex items-center justify-center text-slate-500 group-hover:text-slate-300 transition-colors duration-500`}>
                <div className={`absolute inset-0 ${isCompact ? "rounded-xl" : iconRound} bg-linear-to-br ${point.gradient} opacity-0 ${!isComingSoon ? "group-hover:opacity-10" : ""} transition-opacity duration-500`} />
                <div className="relative">
                  {POINT_ICONS[point.icon] ? <DrawSvg>{POINT_ICONS[point.icon] as React.ReactElement}</DrawSvg> : point.icon}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className={`${titleSize} font-light tracking-tight text-white`}>
                  {point.title}
                </h3>
                {isComingSoon && (
                  <span className="shrink-0 px-3 py-1 text-xs tracking-wide text-slate-600 border border-white/6 rounded-full">
                    Coming soon
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-500 tracking-wide mb-3">
                {point.subtitle}
              </p>

              {/* Authority metadata */}
              {meta && !isCompact && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-4">
                  <span>{meta.time}</span>
                  <span className="w-0.5 h-0.5 rounded-full bg-slate-700" />
                  <span>{meta.audience}</span>
                  {point.sectionCount && (
                    <>
                      <span className="w-0.5 h-0.5 rounded-full bg-slate-700" />
                      <span>{point.sectionCount} {isPaper ? "sections" : "slides"}</span>
                    </>
                  )}
                </div>
              )}

              {!isCompact && (
                <p className="text-slate-400 font-light leading-relaxed mb-6 max-w-2xl">
                  {point.description}
                </p>
              )}

              {/* Tags */}
              {!isCompact && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  {point.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs text-slate-500 border border-white/6 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div className="flex items-center text-sm">
                {isComingSoon ? (
                  <span className="text-slate-600">In development</span>
                ) : (
                  <span className="flex items-center gap-3 text-slate-400 group-hover:text-white transition-colors duration-500">
                    {isPaper ? "Read paper" : "View presentation"}
                    <svg
                      className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </span>
                )}
              </div>
            </div>

            {/* Mini diagram preview */}
            {thumb && !isComingSoon && !isCompact && (
              <div className={`hidden md:block absolute right-8 bottom-8 transition-opacity duration-700 pointer-events-none ${
                isSlides
                  ? "w-36 h-28 opacity-30 group-hover:opacity-50"
                  : isFeatured
                    ? "w-32 h-24 opacity-40"
                    : "w-32 h-24 opacity-0 group-hover:opacity-30"
              }`}>
                {thumb}
              </div>
            )}
          </div>

          {/* Paper: horizontal line motif */}
          {isPaper && !isComingSoon && !isCompact && (
            <div className="absolute bottom-6 left-6 right-20 flex flex-col gap-1.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-px bg-white/4" style={{ width: `${85 - i * 15}%` }} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

// ──────────────────────────────────────────────
// Page Client
// ──────────────────────────────────────────────

export default function PointsPageClient() {
  const livePoints = points.filter((p) => p.status === "live");
  const comingSoonPoints = points.filter((p) => p.status === "coming-soon");

  return (
    <main id="main-content" className="relative min-h-screen">
      <Navbar isSubpage hasStars={false} />

      {/* Hero */}
      <section className="relative pt-48 pb-32 px-6">

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Compass with draw-on animation */}
          <div className="absolute inset-0 -z-1 flex items-center justify-center pointer-events-none">
            <div className="w-100 h-100">
              <DelicateAccent variant="compass" />
            </div>
          </div>

          {/* Choreographed entrance */}
          <motion.p
            className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
          >
            Enterprise Architecture
          </motion.p>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-white mb-8">
            {"Points of View".split(" ").map((word, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.12, ease }}
              >
                {word}
                {i < 2 ? "\u00A0" : ""}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="text-lg md:text-xl text-slate-500 font-light leading-relaxed max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease }}
          >
            Frameworks and perspectives for building systems that scale
          </motion.p>
        </div>
      </section>

      {/* Divider — expands from center */}
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          className="h-px bg-white/10 origin-center"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1, delay: 1.1, ease }}
        />
      </div>

      {/* Cards — bento grid */}
      <section className="relative pt-24 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          {livePoints.length > 0 && (
            <div>
              <motion.h2
                className="text-xs uppercase tracking-[0.2em] text-slate-600 mb-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                Published
              </motion.h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Featured card spans both columns */}
                <div className="md:col-span-2">
                  <PointCard point={livePoints[0]} index={0} variant="featured" />
                </div>
                {/* Remaining cards side by side */}
                {livePoints.slice(1).map((point, i) => (
                  <div key={point.slug}>
                    <PointCard point={point} index={i + 1} variant="standard" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coming soon */}
          {comingSoonPoints.length > 0 && (
            <>
              <motion.div
                className="my-16 h-px bg-linear-to-r from-transparent via-white/8 to-transparent"
                initial={{ opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease }}
              />

              <motion.h2
                className="text-xs uppercase tracking-[0.2em] text-slate-600 mb-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                Coming Soon
              </motion.h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {comingSoonPoints.map((point, i) => (
                  <PointCard
                    key={point.slug}
                    point={point}
                    index={livePoints.length + i}
                    variant="compact"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

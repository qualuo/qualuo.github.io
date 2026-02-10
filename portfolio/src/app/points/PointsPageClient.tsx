"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { points, Point } from "@/lib/points";
import { Navbar } from "@/components/layout/Navbar";

const ease = [0.23, 1, 0.32, 1] as const;

// ──────────────────────────────────────────────
// Point Card
// ──────────────────────────────────────────────

function PointCard({ point, index }: { point: Point; index: number }) {
  const isComingSoon = point.status === "coming-soon";

  return (
    <Link
      href={isComingSoon ? "#" : `/points/${point.slug}`}
      className={`group block ${isComingSoon ? "cursor-default" : ""}`}
      onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, delay: index * 0.15, ease }}
      >
        <div
          className={`
            relative p-8 md:p-12 rounded-2xl
            border border-white/6 bg-white/2
            transition-all duration-500 ease-out
            ${!isComingSoon ? "group-hover:border-white/12 group-hover:bg-white/4" : ""}
          `}
        >
          <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-12">
            {/* Icon */}
            <div className="shrink-0">
              <div className="w-14 h-14 rounded-xl bg-white/4 border border-white/6 flex items-center justify-center text-2xl">
                {point.icon}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="text-2xl md:text-3xl font-light tracking-tight text-white">
                  {point.title}
                </h3>
                {isComingSoon && (
                  <span className="shrink-0 px-3 py-1 text-xs tracking-wide text-slate-600 border border-white/6 rounded-full">
                    Coming soon
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-500 tracking-wide mb-4">
                {point.subtitle}
              </p>

              <p className="text-slate-400 font-light leading-relaxed mb-6 max-w-2xl">
                {point.description}
              </p>

              {/* Tags + section count */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {point.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs text-slate-500 border border-white/6 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {point.sectionCount && (
                  <span className="px-3 py-1 text-xs text-slate-600 border border-white/4 rounded-full">
                    {point.sectionCount} sections
                  </span>
                )}
              </div>

              {/* CTA */}
              <div className="flex items-center text-sm">
                {isComingSoon ? (
                  <span className="text-slate-600">In development</span>
                ) : (
                  <span className="flex items-center gap-3 text-slate-400 group-hover:text-white transition-colors duration-500">
                    View presentation
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
          </div>
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
      {/* Subtle dot grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <Navbar isSubpage hasStars={false} />

      {/* Hero */}
      <section className="relative pt-48 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.p
            className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
          >
            Enterprise Architecture
          </motion.p>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-white mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
          >
            Points of View
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-slate-500 font-light leading-relaxed max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
          >
            Ideas and language to optimize results.
          </motion.p>

          {/* Animated gradient line */}
          <motion.div
            className="mx-auto w-24 h-px"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5, ease }}
          >
            <div className="w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <motion.div
        className="max-w-4xl mx-auto px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div className="h-px bg-white/10" />
      </motion.div>

      {/* Cards */}
      <section className="relative pt-24 pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          {livePoints.length > 0 && (
            <div>
              <motion.h2
                className="text-xs uppercase tracking-[0.2em] text-slate-600 mb-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                Presentations
              </motion.h2>

              <div className="space-y-8">
                {livePoints.map((point, index) => (
                  <PointCard key={point.slug} point={point} index={index} />
                ))}
              </div>
            </div>
          )}

          {comingSoonPoints.length > 0 && (
            <div className="mt-32">
              <motion.h2
                className="text-xs uppercase tracking-[0.2em] text-slate-600 mb-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                In Development
              </motion.h2>

              <div className="space-y-8">
                {comingSoonPoints.map((point, index) => (
                  <PointCard key={point.slug} point={point} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

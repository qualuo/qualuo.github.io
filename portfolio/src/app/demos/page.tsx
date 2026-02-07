"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { demos, Demo } from "@/lib/demos";
import { StarsBackground } from "@/components/animations/StarsBackground";
import { Navbar } from "@/components/layout/Navbar";

function DemoCard({ demo }: { demo: Demo }) {
  const isComingSoon = demo.status === "coming-soon";

  return (
      <Link
        href={isComingSoon ? "#" : `/demos/${demo.slug}`}
        className={`group block relative ${isComingSoon ? "cursor-default" : ""}`}
        onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
      >
        <motion.div
          className="relative h-full rounded-3xl overflow-hidden"
          whileHover={isComingSoon ? {} : { scale: 1.02, y: -8 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Gradient background with glow */}
          <div
            className={`absolute inset-0 bg-linear-to-br ${demo.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-500`}
          />

          {/* Card content */}
          <div className="relative p-8 md:p-10 bg-white/3 border border-white/8 rounded-3xl backdrop-blur-sm h-full flex flex-col min-h-80">
            {/* Header with icon and status */}
            <div className="flex items-start justify-between mb-6">
              {/* Icon with gradient background */}
              <motion.div
                className={`w-16 h-16 rounded-2xl bg-linear-to-br ${demo.gradient} flex items-center justify-center text-3xl shadow-lg`}
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                {demo.icon}
              </motion.div>

              {/* Status badge */}
              {isComingSoon && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/5 text-slate-500 border border-white/10">
                  Coming Soon
                </span>
              )}
            </div>

            {/* Title and subtitle */}
            <div className="mb-4">
              <h3 className="text-2xl md:text-3xl font-semibold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-white group-hover:to-slate-300 transition-all duration-300">
                {demo.title}
              </h3>
              <p className={`text-sm font-medium bg-linear-to-r ${demo.gradient} bg-clip-text text-transparent`}>
                {demo.subtitle}
              </p>
            </div>

            {/* Description */}
            <p className="text-slate-400 leading-relaxed mb-6 grow">
              {demo.description}
            </p>

            {/* Tech tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {demo.tech.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-slate-400 border border-white/5"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center text-sm font-medium mt-auto">
              {isComingSoon ? (
                <span className="text-slate-600">In Development</span>
              ) : (
                <motion.span
                  className={`flex items-center gap-2 bg-linear-to-r ${demo.gradient} bg-clip-text text-transparent`}
                >
                  Launch Demo
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </motion.span>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
  );
}

export default function DemosPage() {
  const liveDemos = demos.filter((d) => d.status === "live");
  const comingSoonDemos = demos.filter((d) => d.status === "coming-soon");

  return (
    <main className="relative min-h-screen">
      <StarsBackground />

      <Navbar isSubpage />

      <section className="relative pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page header */}
          <div className="text-center max-w-4xl mx-auto mb-20">
            {/* Eyebrow */}
            <p className="text-sky-400 text-sm font-medium tracking-widest uppercase mb-4">
              Interactive Experiments
            </p>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-white">Demo </span>
              <span className="bg-linear-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Laboratory
              </span>
            </h1>

            <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Interactive experiments pushing the boundaries of web technology
            </p>
          </div>

          {/* Decorative line */}
          <div className="w-full h-px bg-linear-to-r from-transparent via-white/20 to-transparent mb-16" />

          {/* Live demos section */}
          {liveDemos.length > 0 && (
            <div className="mb-20">
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-8">
                Live Experiments
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {liveDemos.map((demo) => (
                  <DemoCard key={demo.slug} demo={demo} />
                ))}
              </div>
            </div>
          )}

          {/* Coming soon section */}
          {comingSoonDemos.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-8">
                In Development
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {comingSoonDemos.map((demo) => (
                  <DemoCard key={demo.slug} demo={demo} />
                ))}
              </div>
            </div>
          )}

          {/* Performance disclaimer */}
          <div className="mt-20 pt-8 border-t border-white/10">
            <p className="text-center text-sm text-slate-500 max-w-2xl mx-auto">
              <span className="text-slate-400">Note:</span> AI demos run entirely in your browser using smaller, quantized models.
              While impressive for client-side processing, they may be slower and less capable than cloud-based alternatives.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

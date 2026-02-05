"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { demos, Demo } from "@/lib/demos";

function DemoCard({ demo, index }: { demo: Demo; index: number }) {
  const isComingSoon = demo.status === "coming-soon";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.7,
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <Link
        href={isComingSoon ? "#" : `/demos/${demo.slug}`}
        className={`group block relative`}
        onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
        data-cursor={isComingSoon ? "default" : "view"}
        data-cursor-text={isComingSoon ? "" : "Launch"}
      >
        <motion.div
          className="relative h-full rounded-3xl overflow-hidden"
          whileHover={isComingSoon ? {} : { scale: 1.02, y: -8 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Gradient background with glow */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${demo.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-500`}
          />

          {/* Subtle border glow on hover */}
          <div
            className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            style={{
              background: `linear-gradient(135deg, transparent 0%, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%, transparent 100%)`,
              backgroundSize: "200% 200%",
            }}
          />

          {/* Card content */}
          <div className="relative p-8 md:p-10 bg-white/[0.03] border border-white/[0.08] rounded-3xl backdrop-blur-sm h-full flex flex-col">
            {/* Header with icon and status */}
            <div className="flex items-start justify-between mb-6">
              {/* Icon with gradient background */}
              <motion.div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${demo.gradient} flex items-center justify-center text-2xl shadow-lg`}
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
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all duration-300">
                {demo.title}
              </h3>
              <p className={`text-sm font-medium bg-gradient-to-r ${demo.gradient} bg-clip-text text-transparent`}>
                {demo.subtitle}
              </p>
            </div>

            {/* Description */}
            <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-grow">
              {demo.description}
            </p>

            {/* Tech tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {demo.tech.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 text-xs rounded-full bg-white/5 text-slate-500 border border-white/5"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center text-sm font-medium">
              {isComingSoon ? (
                <span className="text-slate-600">In Development</span>
              ) : (
                <>
                  <span className={`bg-gradient-to-r ${demo.gradient} bg-clip-text text-transparent`}>
                    Launch Demo
                  </span>
                  <motion.svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    initial={{ x: 0 }}
                    whileHover={{ x: 4 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                      className={`stroke-current bg-gradient-to-r ${demo.gradient}`}
                      style={{ stroke: "url(#gradient)" }}
                    />
                  </motion.svg>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export function Demos() {
  return (
    <section id="demos" className="relative py-32 lg:py-48 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-sky-400 text-sm font-medium tracking-widest uppercase mb-4"
          >
            Interactive Experiments
          </motion.p>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-white">Demo </span>
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Laboratory
            </span>
          </h2>

          <p className="text-xl text-slate-400 leading-relaxed">
            A collection of interactive experiments exploring the boundaries of
            web technology—from physics simulations to generative art.
          </p>
        </motion.div>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-16"
        />

        {/* Demo grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {demos.map((demo, index) => (
            <DemoCard key={demo.slug} demo={demo} index={index} />
          ))}
        </div>

        {/* View all link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <Link href="/demos" data-cursor="pointer">
            <motion.span
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View All Experiments
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
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

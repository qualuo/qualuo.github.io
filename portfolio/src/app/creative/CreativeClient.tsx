"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { creativeWorks, loveTheme } from "@/lib/creativeWorks";
import { HeartbeatPulse } from "@/components/creative/HeartbeatPulse";
import { LoveCard } from "@/components/creative/LoveCard";
import { ThreadSystem } from "@/components/creative/ThreadSystem";

export default function CreativeClient() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { colors } = loveTheme;

  return (
    <main
      id="main-content"
      className="relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: colors.warmBlack }}
    >
      {/* Heartbeat Background */}
      <HeartbeatPulse />

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-40 p-6"
        style={{
          background: `linear-gradient(to bottom, ${colors.warmBlack}, ${colors.warmBlack}ee 50%, transparent)`,
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/50 hover:text-white/90 transition-colors group"
          >
            <svg
              className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="text-sm">Return</span>
          </Link>

          {/* Pulse indicator */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.warmBlush }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: loveTheme.heartbeat.duration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <span className="text-white/30 text-xs tracking-widest uppercase">
              Alive
            </span>
          </motion.div>

          <div className="w-16" />
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10 pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-20 max-w-2xl"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full mb-8"
              style={{
                backgroundColor: `${colors.deepRose}15`,
                border: `1px solid ${colors.deepRose}30`,
              }}
            >
              <motion.span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors.warmBlush }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: loveTheme.heartbeat.duration,
                  repeat: Infinity,
                }}
              />
              <span
                className="text-sm tracking-wide"
                style={{ color: colors.warmBlush }}
              >
                Creative Portal
              </span>
            </motion.div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-[1.1]">
              Made with
              <br />
              <span
                className="font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${colors.warmBlush}, ${colors.softGold})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Love
              </span>
              <span className="text-white/20">.</span>
            </h1>

            {/* Subtitle */}
            <motion.p
              className="text-lg md:text-xl text-white/50 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Experiments in connection, expression, and craft.
              <br />
              <span className="text-white/30">
                Hover to feel. Click to enter.
              </span>
            </motion.p>
          </motion.header>

          {/* Cards Grid with Thread System */}
          <motion.div
            ref={gridRef}
            className="relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Thread connections */}
            <ThreadSystem
              works={creativeWorks}
              hoveredId={hoveredId}
              containerRef={gridRef}
            />

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              {creativeWorks.map((work, index) => (
                <LoveCard
                  key={work.id}
                  work={work}
                  index={index}
                  onHover={setHoveredId}
                />
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.footer
            className="mt-24 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <p className="text-white/20 text-sm mb-2">
              {creativeWorks.length} expressions of care
            </p>
            <motion.div
              className="flex items-center justify-center gap-2"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div
                className="w-8 h-px"
                style={{ backgroundColor: colors.deepRose }}
              />
              <svg
                className="w-4 h-4"
                style={{ color: colors.warmBlush }}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <div
                className="w-8 h-px"
                style={{ backgroundColor: colors.deepRose }}
              />
            </motion.div>
          </motion.footer>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-20"
        style={{
          background: `linear-gradient(to top, ${colors.warmBlack}, transparent)`,
        }}
      />
    </main>
  );
}

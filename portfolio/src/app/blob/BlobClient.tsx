"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";

const MorphingBlob = dynamic(
  () => import("@/components/animations/MorphingBlob").then(m => ({ default: m.MorphingBlob })),
  { ssr: false }
);

export default function BlobClient() {
  const [clicked, setClicked] = useState(false);

  return (
    <main
      id="main-content"
      className="relative min-h-screen bg-black overflow-hidden"
      onClick={() => setClicked(true)}
    >
      {/* The blob - full spotlight */}
      <div className="absolute inset-0">
        <MorphingBlob />
      </div>

      {/* Subtle vignette overlay */}
      <div className="absolute inset-0 pointer-events-none bg-radial-[ellipse_at_center] from-transparent via-transparent to-black/40" />

      {/* Minimal navigation */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="fixed top-0 left-0 right-0 z-40 p-6 pointer-events-none"
      >
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-sm"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back
        </Link>
      </motion.nav>

      {/* Centered content — disappears after first click */}
      <AnimatePresence>
        {!clicked && (
          <motion.div
            className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pointer-events-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-light text-white/90 tracking-tight mb-4">
                Iridescent
              </h1>
              <p className="text-white/40 text-sm md:text-base max-w-md mx-auto">
                A morphing form rendered with custom GLSL shaders,
                Perlin noise displacement, and Fresnel-based iridescence.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

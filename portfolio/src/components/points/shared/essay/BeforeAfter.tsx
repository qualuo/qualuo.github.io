"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, type ReactNode } from "react";

interface BeforeAfterProps {
  before: ReactNode;
  after: ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function BeforeAfter({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  className = "",
}: BeforeAfterProps) {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <div className={`my-10 ${className}`}>
      {/* Segmented control */}
      <div className="flex justify-center mb-8">
        <div className="relative inline-flex rounded-full bg-white/4 border border-white/8 p-0.5">
          {/* Animated pill indicator */}
          <motion.div
            className="absolute top-0.5 bottom-0.5 rounded-full bg-white/10"
            initial={false}
            animate={{
              left: showAfter ? "50%" : "2px",
              right: showAfter ? "2px" : "50%",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          <button
            onClick={() => setShowAfter(false)}
            className={`relative z-10 px-5 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${
              !showAfter ? "text-white" : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {beforeLabel}
          </button>
          <button
            onClick={() => setShowAfter(true)}
            className={`relative z-10 px-5 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${
              showAfter ? "text-white" : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {afterLabel}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          {showAfter ? (
            <motion.div
              key="after"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            >
              {after}
            </motion.div>
          ) : (
            <motion.div
              key="before"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            >
              {before}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

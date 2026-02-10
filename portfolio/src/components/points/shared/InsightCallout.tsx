"use client";

import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";

interface InsightCalloutProps {
  children: ReactNode;
  gradient?: string;
}

export function InsightCallout({
  children,
  gradient = "from-purple-400 to-indigo-400",
}: InsightCalloutProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className="relative mt-8 pl-5"
      initial={{ opacity: 0, x: -12 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Gradient left border */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-linear-to-b ${gradient}`}
      />
      {/* Subtle glow behind the border */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-4 bg-linear-to-r ${gradient} opacity-[0.04] rounded-r-lg pointer-events-none`}
      />
      <p className="text-sm text-slate-400 leading-relaxed italic">
        {children}
      </p>
    </motion.div>
  );
}

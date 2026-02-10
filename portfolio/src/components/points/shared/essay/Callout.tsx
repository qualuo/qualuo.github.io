"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";

type CalloutVariant = "insight" | "warning" | "note" | "tip";

const VARIANT_STYLES: Record<CalloutVariant, { gradient: string; bg: string }> = {
  insight: { gradient: "from-violet-400 to-fuchsia-400", bg: "violet" },
  warning: { gradient: "from-amber-400 to-orange-400", bg: "amber" },
  note: { gradient: "from-blue-400 to-cyan-400", bg: "blue" },
  tip: { gradient: "from-emerald-400 to-teal-400", bg: "emerald" },
};

interface CalloutProps {
  children: ReactNode;
  variant?: CalloutVariant;
  className?: string;
}

export function Callout({
  children,
  variant = "insight",
  className = "",
}: CalloutProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const style = VARIANT_STYLES[variant];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -8 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className={`relative pl-5 py-3 my-6 ${className}`}
    >
      {/* Left border gradient */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-px bg-linear-to-b ${style.gradient} rounded-full`}
      />
      {/* Subtle glow behind border */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-6 bg-linear-to-r ${style.gradient} opacity-[0.04] blur-lg`}
      />
      <div className="relative text-slate-300 text-sm leading-relaxed">
        {children}
      </div>
    </motion.div>
  );
}

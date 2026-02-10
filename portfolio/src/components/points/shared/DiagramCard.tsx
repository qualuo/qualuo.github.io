"use client";

import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";

interface DiagramCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  gradient?: string;
}

export function DiagramCard({
  children,
  className = "",
  delay = 0,
  gradient,
}: DiagramCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className={`relative p-6 md:p-8 bg-white/3 border border-white/8 rounded-2xl backdrop-blur-sm ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {gradient && (
        <div
          className={`absolute inset-0 bg-linear-to-br ${gradient} opacity-5 rounded-2xl pointer-events-none`}
        />
      )}
      <div className="relative">{children}</div>
    </motion.div>
  );
}

"use client";

import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";

interface PresentationSectionProps {
  children: ReactNode;
  className?: string;
  eyebrow?: string;
  title?: string;
  gradient?: string;
}

export function PresentationSection({
  children,
  className = "",
  eyebrow,
  title,
  gradient = "from-purple-400 to-indigo-400",
}: PresentationSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
    >
      {eyebrow && (
        <p
          className={`text-sm font-medium tracking-widest uppercase mb-3 bg-linear-to-r ${gradient} bg-clip-text text-transparent`}
        >
          {eyebrow}
        </p>
      )}
      {title && (
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          {title}
        </h2>
      )}
      {children}
    </motion.div>
  );
}

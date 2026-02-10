"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface EssaySectionProps {
  id: string;
  title: string;
  eyebrow?: string;
  gradient?: string;
  children: ReactNode;
  className?: string;
  wide?: boolean;
}

export function EssaySection({
  id,
  title,
  eyebrow,
  gradient = "from-violet-400 via-purple-400 to-fuchsia-400",
  children,
  className = "",
  wide = false,
}: EssaySectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      id={id}
      className={`relative ${wide ? "" : "max-w-3xl mx-auto px-6 lg:px-10"} ${className}`}
    >
      <motion.div
        className="mb-10"
        initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
        animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      >
        {eyebrow && (
          <p
            className={`text-xs font-semibold uppercase tracking-[0.25em] mb-4 bg-linear-to-r ${gradient} bg-clip-text text-transparent`}
          >
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]">
          {title}
        </h2>
      </motion.div>

      {children}
    </section>
  );
}

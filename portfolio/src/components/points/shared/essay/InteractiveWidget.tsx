"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface InteractiveWidgetProps {
  children: ReactNode;
  title?: string;
  hint?: string;
  className?: string;
}

export function InteractiveWidget({
  children,
  title,
  hint,
  className = "",
}: InteractiveWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className={`relative rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm overflow-hidden my-6 ${className}`}
    >
      {title && (
        <div className="px-6 py-3 border-b border-white/6 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          {hint && (
            <span className="text-xs text-slate-500">{hint}</span>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

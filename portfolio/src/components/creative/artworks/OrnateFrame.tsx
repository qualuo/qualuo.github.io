"use client";

import { motion, MotionValue } from "framer-motion";

interface OrnateFrameProps {
  color: string;
  children: React.ReactNode;
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  className?: string;
}

export function OrnateFrame({ color, children, opacity, scale, className = "" }: OrnateFrameProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      style={{ opacity, scale }}
    >
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{ border: `1px solid ${color}20` }}
      />
      <div className="relative overflow-hidden rounded-lg">
        {children}
      </div>
    </motion.div>
  );
}

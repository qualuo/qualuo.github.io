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
      {/* Outer glow */}
      <div
        className="absolute -inset-8 rounded-lg blur-[60px] opacity-20"
        style={{ backgroundColor: color }}
      />

      {/* Baroque corner ornaments */}
      <svg className="absolute -top-6 -left-6 w-16 h-16 pointer-events-none" viewBox="0 0 64 64" fill="none">
        <path
          d="M4 60 C4 30 30 4 60 4"
          stroke={color}
          strokeWidth="0.5"
          opacity="0.4"
        />
        <path
          d="M8 56 C8 34 34 8 56 8"
          stroke={color}
          strokeWidth="0.3"
          opacity="0.25"
        />
        <circle cx="4" cy="60" r="2" fill={color} opacity="0.3" />
        <path
          d="M12 52 Q12 32 32 12"
          stroke={color}
          strokeWidth="0.5"
          opacity="0.15"
        />
        {/* Flourish curl */}
        <path
          d="M4 48 C8 48 12 44 12 40 C12 36 8 34 6 36 C4 38 6 42 10 42"
          stroke={color}
          strokeWidth="0.4"
          opacity="0.3"
          fill="none"
        />
      </svg>

      <svg className="absolute -top-6 -right-6 w-16 h-16 pointer-events-none" viewBox="0 0 64 64" fill="none" style={{ transform: "scaleX(-1)" }}>
        <path d="M4 60 C4 30 30 4 60 4" stroke={color} strokeWidth="0.5" opacity="0.4" />
        <path d="M8 56 C8 34 34 8 56 8" stroke={color} strokeWidth="0.3" opacity="0.25" />
        <circle cx="4" cy="60" r="2" fill={color} opacity="0.3" />
        <path d="M4 48 C8 48 12 44 12 40 C12 36 8 34 6 36 C4 38 6 42 10 42" stroke={color} strokeWidth="0.4" opacity="0.3" fill="none" />
      </svg>

      <svg className="absolute -bottom-6 -left-6 w-16 h-16 pointer-events-none" viewBox="0 0 64 64" fill="none" style={{ transform: "scaleY(-1)" }}>
        <path d="M4 60 C4 30 30 4 60 4" stroke={color} strokeWidth="0.5" opacity="0.4" />
        <path d="M8 56 C8 34 34 8 56 8" stroke={color} strokeWidth="0.3" opacity="0.25" />
        <circle cx="4" cy="60" r="2" fill={color} opacity="0.3" />
        <path d="M4 48 C8 48 12 44 12 40 C12 36 8 34 6 36 C4 38 6 42 10 42" stroke={color} strokeWidth="0.4" opacity="0.3" fill="none" />
      </svg>

      <svg className="absolute -bottom-6 -right-6 w-16 h-16 pointer-events-none" viewBox="0 0 64 64" fill="none" style={{ transform: "scale(-1)" }}>
        <path d="M4 60 C4 30 30 4 60 4" stroke={color} strokeWidth="0.5" opacity="0.4" />
        <path d="M8 56 C8 34 34 8 56 8" stroke={color} strokeWidth="0.3" opacity="0.25" />
        <circle cx="4" cy="60" r="2" fill={color} opacity="0.3" />
        <path d="M4 48 C8 48 12 44 12 40 C12 36 8 34 6 36 C4 38 6 42 10 42" stroke={color} strokeWidth="0.4" opacity="0.3" fill="none" />
      </svg>

      {/* Frame border (double line, gold-like) */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{ border: `1px solid ${color}25` }}
      />
      <div
        className="absolute inset-1 rounded-lg pointer-events-none"
        style={{ border: `0.5px solid ${color}15` }}
      />

      {/* Top and bottom ornamental dividers */}
      <svg className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-4 pointer-events-none" viewBox="0 0 96 16" fill="none">
        <path d="M0 8 L36 8 M60 8 L96 8" stroke={color} strokeWidth="0.5" opacity="0.3" />
        <path d="M38 4 Q48 0 58 4 Q48 8 38 4Z" fill={color} opacity="0.15" />
        <circle cx="48" cy="4" r="1.5" fill={color} opacity="0.25" />
      </svg>

      <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-24 h-4 pointer-events-none" viewBox="0 0 96 16" fill="none">
        <path d="M0 8 L36 8 M60 8 L96 8" stroke={color} strokeWidth="0.5" opacity="0.3" />
        <path d="M38 12 Q48 16 58 12 Q48 8 38 12Z" fill={color} opacity="0.15" />
        <circle cx="48" cy="12" r="1.5" fill={color} opacity="0.25" />
      </svg>

      {/* Content */}
      <div className="relative overflow-hidden rounded-lg">
        {children}
      </div>
    </motion.div>
  );
}

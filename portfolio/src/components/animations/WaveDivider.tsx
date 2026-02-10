"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

let instanceCounter = 0;

export function WaveDivider({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef(`wave-${++instanceCounter}`);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const x1 = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  const gradId1 = `${idRef.current}-g1`;
  const gradId2 = `${idRef.current}-g2`;

  return (
    <div
      ref={ref}
      className={`relative w-full h-20 md:h-28 pointer-events-none select-none overflow-hidden ${className}`}
    >
      <style>{`
        @keyframes wave-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
      `}</style>

      {/* Wave layer 1 — slow drift left */}
      <motion.svg
        style={{ x: x1, opacity }}
        className="absolute inset-0 w-[150%] h-full -left-[25%]"
        viewBox="0 0 2160 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id={gradId1} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="30%" stopColor="rgba(139,92,246,0.25)" />
            <stop offset="50%" stopColor="rgba(96,165,250,0.35)" />
            <stop offset="70%" stopColor="rgba(139,92,246,0.25)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M0,50 C180,80 360,20 540,50 C720,80 900,20 1080,50 C1260,80 1440,20 1620,50 C1800,80 1980,20 2160,50"
          stroke={`url(#${gradId1})`}
          strokeWidth="0.5"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset="1"
          style={{ animation: "wave-draw 1.6s ease-out 0.8s forwards" }}
        />
      </motion.svg>

      {/* Wave layer 2 — slow drift right, different phase */}
      <motion.svg
        style={{ x: x2, opacity }}
        className="absolute inset-0 w-[150%] h-full -left-[25%]"
        viewBox="0 0 2160 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id={gradId2} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="25%" stopColor="rgba(56,189,248,0.2)" />
            <stop offset="50%" stopColor="rgba(168,85,247,0.3)" />
            <stop offset="75%" stopColor="rgba(56,189,248,0.2)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M0,55 C240,25 480,75 720,45 C960,15 1200,65 1440,45 C1680,25 1920,75 2160,55"
          stroke={`url(#${gradId2})`}
          strokeWidth="0.4"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset="1"
          style={{ animation: "wave-draw 1.8s ease-out 1.1s forwards" }}
        />
      </motion.svg>
    </div>
  );
}

"use client";

import { type ReactNode } from "react";
import { ProgressBar } from "./ProgressBar";

interface ScrollEssayProps {
  children: ReactNode;
  gradient?: string;
}

export function ScrollEssay({
  children,
  gradient = "from-violet-400 via-purple-400 to-fuchsia-400",
}: ScrollEssayProps) {
  return (
    <article className="relative bg-[#171717] min-h-screen">
      <ProgressBar gradient={gradient} />

      {/* Ambient gradient blobs — subtle section mood lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div
          className="absolute w-200 h-200 rounded-full"
          style={{
            top: "15%",
            left: "-10%",
            background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute w-150 h-150 rounded-full"
          style={{
            top: "35%",
            right: "-8%",
            background: "radial-gradient(circle, rgba(167,139,250,0.03) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute w-175 h-175 rounded-full"
          style={{
            top: "55%",
            left: "-5%",
            background: "radial-gradient(circle, rgba(139,92,246,0.035) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute w-125 h-125 rounded-full"
          style={{
            top: "75%",
            right: "-12%",
            background: "radial-gradient(circle, rgba(167,139,250,0.025) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-40"
        style={{ opacity: 0.015 }}
      >
        <svg width="100%" height="100%">
          <filter id="essay-grain">
            <feTurbulence baseFrequency="0.9" numOctaves="4" />
          </filter>
          <rect width="100%" height="100%" filter="url(#essay-grain)" />
        </svg>
      </div>

      <div className="relative z-10">{children}</div>
    </article>
  );
}

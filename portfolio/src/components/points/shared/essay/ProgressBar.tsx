"use client";

import { motion, useScroll, useSpring } from "framer-motion";

interface ProgressBarProps {
  gradient?: string;
}

export function ProgressBar({
  gradient = "from-violet-400 via-purple-400 to-fuchsia-400",
}: ProgressBarProps) {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-px">
      <motion.div
        className={`h-full bg-linear-to-r ${gradient} origin-left`}
        style={{ scaleX: smoothProgress }}
      />
      {/* Subtle glow at the leading edge */}
      <motion.div
        className="absolute top-0 h-1 w-16 blur-sm bg-violet-400/40 origin-left"
        style={{ left: smoothProgress }}
      />
    </div>
  );
}

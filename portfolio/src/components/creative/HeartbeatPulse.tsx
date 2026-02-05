"use client";

import { motion } from "framer-motion";
import { loveTheme } from "@/lib/creativeWorks";

export function HeartbeatPulse() {
  const { heartbeat, colors } = loveTheme;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Central pulse - the heart of the page */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          scale: heartbeat.scale,
          opacity: heartbeat.opacity,
        }}
        transition={{
          duration: heartbeat.duration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div
          className="w-[800px] h-[800px] rounded-full blur-[150px]"
          style={{
            background: `radial-gradient(circle, ${colors.deepRose}30, ${colors.warmBlush}10, transparent 70%)`,
          }}
        />
      </motion.div>

      {/* Secondary pulse - slightly offset rhythm */}
      <motion.div
        className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2"
        animate={{
          scale: [1, 1.03, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: heartbeat.duration * 1.1,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      >
        <div
          className="w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{
            background: `radial-gradient(circle, ${colors.softGold}20, transparent 70%)`,
          }}
        />
      </motion.div>

      {/* Tertiary pulse - bottom right warmth */}
      <motion.div
        className="absolute bottom-1/4 right-1/4"
        animate={{
          scale: [1, 1.04, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: heartbeat.duration * 0.9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4,
        }}
      >
        <div
          className="w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{
            background: `radial-gradient(circle, ${colors.warmBlush}25, transparent 70%)`,
          }}
        />
      </motion.div>

      {/* Floating warmth particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4 + Math.random() * 4,
            height: 4 + Math.random() * 4,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            backgroundColor: i % 3 === 0 ? colors.softGold : colors.warmBlush,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Vignette for intimacy */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, ${colors.warmBlack}90 100%)`,
        }}
      />
    </div>
  );
}

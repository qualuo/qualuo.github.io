"use client";

import { useMemo } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

function createPRNG(seed = 1) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

interface Props {
  color: string;
  scrollProgress: MotionValue<number>;
}

export function VoiceIntimacyArt({ color, scrollProgress }: Props) {
  const scale = useTransform(scrollProgress, [0.2, 0.5, 0.8], [0.85, 1, 0.95]);

  const waveforms = useMemo(() => {
    const rand = createPRNG(13);
    return Array.from({ length: 5 }, (_, row) => {
      const points = Array.from({ length: 60 }, (_, i) => {
        const x = (i / 59) * 400;
        const baseY = 80 + row * 60;
        const amp = 8 + rand() * 20;
        const freq = 0.02 + rand() * 0.04;
        const y = baseY + Math.sin(i * freq * Math.PI) * amp;
        return `${x},${y}`;
      });
      return {
        path: `M${points.join(" L")}`,
        opacity: 0.12 + (1 - row / 5) * 0.15,
        delay: row * 0.3,
      };
    });
  }, []);

  const ripples = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      r: 30 + i * 25,
      delay: i * 0.4,
      duration: 3 + i * 0.5,
    }));
  }, []);

  return (
    <div className="w-full aspect-square relative">
      <motion.div style={{ scale }} className="w-full h-full">
        <svg viewBox="0 0 400 400" className="w-full h-full" fill="none">
          <defs>
            <radialGradient id="voice-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.15" />
              <stop offset="70%" stopColor={color} stopOpacity="0.03" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="200" cy="200" r="190" fill="url(#voice-glow)" />

          {/* Expanding ripples from center */}
          {ripples.map((rip, i) => (
            <motion.circle
              key={`rip${i}`}
              cx="200" cy="200"
              r={rip.r}
              stroke={color}
              strokeWidth="0.5"
              fill="none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0, 0.2, 0],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: rip.duration,
                repeat: Infinity,
                delay: rip.delay,
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "200px 200px" }}
            />
          ))}

          {/* Waveform lines */}
          {waveforms.map((wf, i) => (
            <motion.path
              key={`wf${i}`}
              d={wf.path}
              stroke={color}
              strokeWidth="1"
              strokeOpacity={wf.opacity}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: wf.delay, ease: "easeOut" }}
            />
          ))}

          {/* Center speaker/mic icon */}
          <motion.g
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "200px 200px" }}
          >
            <circle cx="200" cy="200" r="12" fill={color} opacity="0.5" />
            <circle cx="200" cy="200" r="6" fill={color} opacity="0.8" />
            {/* Sound wave arcs */}
            {[20, 28, 36].map((r, i) => (
              <motion.path
                key={`arc${i}`}
                d={`M${200 + r * Math.cos(Math.PI * 0.75)} ${200 - r * Math.sin(Math.PI * 0.75)} A${r} ${r} 0 0 1 ${200 + r * Math.cos(Math.PI * 0.25)} ${200 - r * Math.sin(Math.PI * 0.25)}`}
                stroke={color}
                strokeWidth="1"
                fill="none"
                animate={{ opacity: [0.1, 0.4, 0.1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
              />
            ))}
          </motion.g>
        </svg>
      </motion.div>
    </div>
  );
}

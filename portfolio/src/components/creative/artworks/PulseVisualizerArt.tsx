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

export function PulseVisualizerArt({ color, scrollProgress }: Props) {
  const rotation = useTransform(scrollProgress, [0.15, 0.85], [0, 90]);

  // Equalizer bars arranged in a circle
  const bars = useMemo(() => {
    const rand = createPRNG(19);
    return Array.from({ length: 48 }, (_, i) => {
      const angle = (i / 48) * Math.PI * 2 - Math.PI / 2;
      const baseHeight = 15 + rand() * 40;
      return {
        angle,
        x: 200 + Math.cos(angle) * 100,
        y: 200 + Math.sin(angle) * 100,
        height: baseHeight,
        delay: (i / 48) * 2,
        duration: 0.8 + rand() * 1.2,
      };
    });
  }, []);

  // Inner frequency rings
  const rings = useMemo(() =>
    Array.from({ length: 4 }, (_, i) => ({
      r: 40 + i * 20,
      dashArray: `${3 + i * 2} ${8 + i * 3}`,
      speed: 15 + i * 5,
      direction: i % 2 === 0 ? 1 : -1,
    })),
  []);

  return (
    <div className="w-full aspect-square relative">
      <motion.div style={{ rotate: rotation }} className="w-full h-full">
        <svg viewBox="0 0 400 400" className="w-full h-full" fill="none">
          <defs>
            <radialGradient id="pulse-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="60%" stopColor={color} stopOpacity="0.05" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="200" cy="200" r="190" fill="url(#pulse-glow)" />

          {/* Circular equalizer bars */}
          {bars.map((bar, i) => {
            const dx = Math.cos(bar.angle);
            const dy = Math.sin(bar.angle);
            return (
              <motion.line
                key={`bar${i}`}
                x1={bar.x}
                y1={bar.y}
                x2={bar.x + dx * bar.height}
                y2={bar.y + dy * bar.height}
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                animate={{
                  x2: [
                    bar.x + dx * bar.height * 0.3,
                    bar.x + dx * bar.height,
                    bar.x + dx * bar.height * 0.5,
                    bar.x + dx * bar.height * 0.8,
                    bar.x + dx * bar.height * 0.3,
                  ],
                  y2: [
                    bar.y + dy * bar.height * 0.3,
                    bar.y + dy * bar.height,
                    bar.y + dy * bar.height * 0.5,
                    bar.y + dy * bar.height * 0.8,
                    bar.y + dy * bar.height * 0.3,
                  ],
                  opacity: [0.15, 0.4, 0.2, 0.35, 0.15],
                }}
                transition={{
                  duration: bar.duration,
                  repeat: Infinity,
                  delay: bar.delay,
                  ease: "easeInOut",
                }}
              />
            );
          })}

          {/* Inner rotating frequency rings */}
          {rings.map((ring, i) => (
            <motion.circle
              key={`ring${i}`}
              cx="200" cy="200" r={ring.r}
              stroke={color}
              strokeWidth="0.5"
              strokeDasharray={ring.dashArray}
              fill="none"
              opacity="0.15"
              animate={{ rotate: [0, 360 * ring.direction] }}
              transition={{ duration: ring.speed, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "200px 200px" }}
            />
          ))}

          {/* Center pulsing core */}
          <motion.circle
            cx="200" cy="200" r="8"
            fill={color}
            animate={{ r: [8, 12, 8], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx="200" cy="200" r="20"
            stroke={color}
            strokeWidth="1"
            fill="none"
            animate={{ r: [20, 28, 20], opacity: [0.2, 0.05, 0.2] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

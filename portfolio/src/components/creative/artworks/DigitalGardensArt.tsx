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

interface Branch {
  path: string;
  delay: number;
  duration: number;
  strokeWidth: number;
}

function generateTree(x: number, y: number, angle: number, length: number, depth: number, rand: () => number, branches: Branch[]) {
  if (depth <= 0 || length < 4) return;

  const endX = x + Math.cos(angle) * length;
  const endY = y + Math.sin(angle) * length;

  // Slight curve via control point
  const midX = (x + endX) / 2 + (rand() - 0.5) * length * 0.3;
  const midY = (y + endY) / 2 + (rand() - 0.5) * length * 0.3;

  branches.push({
    path: `M${x},${y} Q${midX},${midY} ${endX},${endY}`,
    delay: (6 - depth) * 0.3 + rand() * 0.2,
    duration: 1 + rand() * 0.5,
    strokeWidth: Math.max(0.5, depth * 0.4),
  });

  const branchCount = depth > 3 ? 3 : 2;
  const spread = 0.4 + rand() * 0.3;

  for (let i = 0; i < branchCount; i++) {
    const newAngle = angle - spread + (spread * 2 * i) / (branchCount - 1) + (rand() - 0.5) * 0.2;
    const newLength = length * (0.6 + rand() * 0.2);
    generateTree(endX, endY, newAngle, newLength, depth - 1, rand, branches);
  }
}

export function DigitalGardensArt({ color, scrollProgress }: Props) {
  const scale = useTransform(scrollProgress, [0.2, 0.5, 0.8], [0.9, 1, 0.95]);

  const { branches, leaves } = useMemo(() => {
    const rand = createPRNG(31);
    const branches: Branch[] = [];
    // Main tree growing upward from bottom center
    generateTree(200, 370, -Math.PI / 2, 60, 6, rand, branches);
    // Secondary smaller tree
    generateTree(120, 380, -Math.PI / 2 - 0.2, 35, 4, rand, branches);
    generateTree(280, 375, -Math.PI / 2 + 0.15, 40, 4, rand, branches);

    // Leaves/flowers at branch tips
    const leaves = branches
      .filter((_, i) => i % 4 === 0)
      .map((b) => {
        const match = b.path.match(/(\d+\.?\d*),(\d+\.?\d*)$/);
        if (!match) return null;
        return {
          cx: parseFloat(match[1]),
          cy: parseFloat(match[2]),
          r: 2 + rand() * 3,
          delay: b.delay + 0.5,
        };
      })
      .filter(Boolean) as { cx: number; cy: number; r: number; delay: number }[];

    return { branches, leaves };
  }, []);

  return (
    <div className="w-full aspect-square relative">
      <motion.div style={{ scale }} className="w-full h-full">
        <svg viewBox="0 0 400 400" className="w-full h-full" fill="none">
          <defs>
            <radialGradient id="garden-glow" cx="50%" cy="80%" r="60%">
              <stop offset="0%" stopColor={color} stopOpacity="0.1" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="200" cy="300" r="200" fill="url(#garden-glow)" />

          {/* Ground line */}
          <motion.line
            x1="40" y1="380" x2="360" y2="380"
            stroke={color}
            strokeWidth="0.5"
            opacity="0.15"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Branches */}
          {branches.map((b, i) => (
            <motion.path
              key={`b${i}`}
              d={b.path}
              stroke={color}
              strokeWidth={b.strokeWidth}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: b.duration, delay: b.delay, ease: "easeOut" }}
            />
          ))}

          {/* Leaves / blossoms */}
          {leaves.map((leaf, i) => (
            <motion.circle
              key={`leaf${i}`}
              cx={leaf.cx}
              cy={leaf.cy}
              r={leaf.r}
              fill={color}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.25, 0.15],
                scale: [0, 1.2, 1],
              }}
              transition={{
                duration: 1,
                delay: leaf.delay,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Floating seeds/spores */}
          {Array.from({ length: 8 }, (_, i) => (
            <motion.circle
              key={`seed${i}`}
              cx={80 + i * 35}
              cy={100 + (i % 3) * 40}
              r="1.5"
              fill={color}
              opacity="0.15"
              animate={{
                y: [0, -20 - (i % 4) * 10, 0],
                x: [0, (i % 2 === 0 ? 10 : -10), 0],
                opacity: [0.08, 0.2, 0.08],
              }}
              transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
            />
          ))}
        </svg>
      </motion.div>
    </div>
  );
}

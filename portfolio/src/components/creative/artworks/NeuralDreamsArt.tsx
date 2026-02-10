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

export function NeuralDreamsArt({ color, scrollProgress }: Props) {
  const rotation = useTransform(scrollProgress, [0.15, 0.85], [0, 180]);
  const innerScale = useTransform(scrollProgress, [0.2, 0.5, 0.8], [0.8, 1, 0.9]);

  const { nodes, connections } = useMemo(() => {
    const rand = createPRNG(7);
    const nodes = Array.from({ length: 24 }, () => ({
      cx: 40 + rand() * 320,
      cy: 40 + rand() * 320,
      r: 2 + rand() * 4,
      pulse: 1 + rand() * 3,
    }));
    const connections: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].cx - nodes[j].cx;
        const dy = nodes[i].cy - nodes[j].cy;
        if (Math.sqrt(dx * dx + dy * dy) < 120) {
          connections.push({ x1: nodes[i].cx, y1: nodes[i].cy, x2: nodes[j].cx, y2: nodes[j].cy });
        }
      }
    }
    return { nodes, connections };
  }, []);

  return (
    <div className="w-full aspect-square relative">
      <motion.div style={{ rotate: rotation, scale: innerScale }} className="w-full h-full">
        <svg viewBox="0 0 400 400" className="w-full h-full" fill="none">
          <defs>
            <radialGradient id="neural-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
            <filter id="neural-blur">
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>

          {/* Background glow */}
          <circle cx="200" cy="200" r="180" fill="url(#neural-glow)" />

          {/* Connections */}
          {connections.map((c, i) => (
            <motion.line
              key={`c${i}`}
              x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
              stroke={color}
              strokeWidth="0.5"
              strokeOpacity="0.15"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: i * 0.05, ease: "easeOut" }}
            />
          ))}

          {/* Concentric orbit rings */}
          {[80, 130, 170].map((r, i) => (
            <motion.circle
              key={`ring${i}`}
              cx="200" cy="200" r={r}
              stroke={color}
              strokeWidth="0.3"
              strokeOpacity="0.08"
              strokeDasharray={`${r * 0.3} ${r * 0.5}`}
              fill="none"
              animate={{ rotate: [0, i % 2 === 0 ? 360 : -360] }}
              transition={{ duration: 30 + i * 10, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "200px 200px" }}
            />
          ))}

          {/* Nodes */}
          {nodes.map((n, i) => (
            <g key={`n${i}`}>
              <motion.circle
                cx={n.cx} cy={n.cy} r={n.r * 2}
                fill={color}
                opacity="0.06"
                filter="url(#neural-blur)"
                animate={{ r: [n.r * 2, n.r * 3, n.r * 2] }}
                transition={{ duration: n.pulse, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.circle
                cx={n.cx} cy={n.cy} r={n.r}
                fill={color}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0.4, 0.8, 0.4], scale: 1 }}
                transition={{
                  opacity: { duration: n.pulse, repeat: Infinity, ease: "easeInOut" },
                  scale: { duration: 0.5, delay: i * 0.08 },
                }}
              />
            </g>
          ))}

          {/* Central nexus */}
          <motion.circle
            cx="200" cy="200" r="6"
            fill={color}
            animate={{ r: [6, 8, 6], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx="200" cy="200" r="16"
            stroke={color}
            strokeWidth="0.5"
            fill="none"
            animate={{ r: [16, 22, 16], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

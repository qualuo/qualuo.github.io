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
  strokeWidth: number;
}

interface Blossom {
  cx: number;
  cy: number;
  r: number;
  delay: number;
}

export function SakuraArt({ color, scrollProgress }: Props) {
  const scale = useTransform(scrollProgress, [0.2, 0.5, 0.8], [0.9, 1, 0.95]);

  const { branches, blossoms, petals } = useMemo(() => {
    const rand = createPRNG(8821);
    const branches: Branch[] = [];
    const blossoms: Blossom[] = [];

    function addBranch(
      x0: number, y0: number,
      angle: number, length: number,
      thickness: number, depth: number,
    ) {
      if (depth > 5 || thickness < 0.4) return;

      const x1 = x0 + Math.cos(angle) * length;
      const y1 = y0 + Math.sin(angle) * length;
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2;
      const perp = angle + Math.PI / 2;
      const curve = (rand() - 0.5) * length * 0.35;
      const cpX = mx + Math.cos(perp) * curve;
      const cpY = my + Math.sin(perp) * curve;

      branches.push({
        path: `M${x0.toFixed(1)},${y0.toFixed(1)} Q${cpX.toFixed(1)},${cpY.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`,
        strokeWidth: thickness,
        delay: depth * 0.2 + rand() * 0.15,
      });

      if (depth >= 3) {
        blossoms.push({
          cx: x1 + (rand() - 0.5) * 8,
          cy: y1 + (rand() - 0.5) * 6,
          r: 2 + rand() * 3.5,
          delay: depth * 0.2 + 0.5 + rand() * 0.4,
        });
      }

      addBranch(x1, y1, angle + (rand() - 0.5) * 0.45, length * 0.72, thickness * 0.65, depth + 1);

      if (depth < 4) {
        const side = rand() > 0.5 ? 1 : -1;
        const t = 0.3 + rand() * 0.4;
        const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cpX + t * t * x1;
        const by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cpY + t * t * y1;
        addBranch(bx, by, angle + side * (0.4 + rand() * 0.5), length * 0.55, thickness * 0.5, depth + 1);
      }
    }

    addBranch(200, 340, -Math.PI / 2 - 0.08, 70, 5, 0);
    addBranch(198, 290, -Math.PI / 2 + 0.4, 50, 3, 1);
    addBranch(198, 290, -Math.PI / 2 - 0.5, 48, 3, 1);

    const petals = Array.from({ length: 6 }, () => ({
      cx: 60 + rand() * 280,
      cy: 40 + rand() * 200,
      r: 1.5 + rand() * 1.5,
      delay: rand() * 5,
      duration: 6 + rand() * 4,
      drift: (rand() - 0.3) * 30,
    }));

    return { branches, blossoms, petals };
  }, []);

  return (
    <div className="w-full aspect-square relative">
      <motion.div style={{ scale }} className="w-full h-full">
        <svg viewBox="0 0 400 400" className="w-full h-full" fill="none">
          <defs>
            <radialGradient id="sakura-glow" cx="50%" cy="60%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.1" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background glow */}
          <circle cx="200" cy="250" r="180" fill="url(#sakura-glow)" />

          {/* Trunk */}
          <motion.path
            d="M200,340 C197,320 204,305 200,285 S193,255 198,235 S206,205 200,180"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeOpacity="0.3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
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
              animate={{ pathLength: 1, opacity: 0.25 }}
              transition={{ duration: 1, delay: b.delay, ease: "easeOut" }}
            />
          ))}

          {/* Blossoms */}
          {blossoms.map((bl, i) => (
            <motion.circle
              key={`bl${i}`}
              cx={bl.cx}
              cy={bl.cy}
              r={bl.r}
              fill={color}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.25, 0.15],
                scale: [0, 1.2, 1],
              }}
              transition={{
                duration: 1,
                delay: bl.delay,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Falling petals */}
          {petals.map((p, i) => (
            <motion.circle
              key={`fp${i}`}
              r={p.r}
              fill={color}
              animate={{
                cx: [p.cx, p.cx + p.drift * 0.5, p.cx + p.drift],
                cy: [p.cy, p.cy + 50, p.cy + 100],
                opacity: [0, 0.2, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </svg>
      </motion.div>
    </div>
  );
}

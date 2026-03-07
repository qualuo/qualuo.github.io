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

export function CelestialGliderArt({ color, scrollProgress }: Props) {
  const scale = useTransform(scrollProgress, [0.2, 0.5, 0.8], [0.9, 1, 0.95]);
  const birdY = useTransform(scrollProgress, [0.2, 0.5, 0.8], [210, 190, 200]);

  const { stars, orbs, clouds, islands } = useMemo(() => {
    const rand = createPRNG(7742);

    const stars = Array.from({ length: 30 }, () => ({
      cx: rand() * 400,
      cy: rand() * 250,
      r: 0.5 + rand() * 1.2,
      delay: rand() * 4,
      duration: 3 + rand() * 3,
    }));

    const orbs = Array.from({ length: 8 }, (_, i) => ({
      cx: 60 + rand() * 280,
      cy: 100 + rand() * 180,
      r: 3 + rand() * 4,
      delay: 0.8 + i * 0.15,
      pulseDelay: rand() * 3,
    }));

    const clouds = Array.from({ length: 4 }, () => ({
      x: rand() * 350,
      y: 250 + rand() * 100,
      width: 40 + rand() * 60,
      height: 10 + rand() * 8,
      delay: rand() * 5,
      duration: 12 + rand() * 8,
      drift: 20 + rand() * 30,
    }));

    const islands = Array.from({ length: 3 }, () => ({
      cx: 50 + rand() * 300,
      cy: 280 + rand() * 80,
      rx: 15 + rand() * 20,
      ry: 6 + rand() * 5,
      delay: 1 + rand() * 0.5,
    }));

    return { stars, orbs, clouds, islands };
  }, []);

  return (
    <div className="w-full aspect-square relative">
      <motion.div style={{ scale }} className="w-full h-full">
        <svg viewBox="0 0 400 400" className="w-full h-full" fill="none">
          <defs>
            <radialGradient id="cg-sky" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#1a2a4a" />
              <stop offset="100%" stopColor="#0a1220" />
            </radialGradient>
            <radialGradient id="cg-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.15" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
            <filter id="cg-blur">
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>

          {/* Sky background */}
          <rect width="400" height="400" fill="url(#cg-sky)" />

          {/* Ambient glow */}
          <circle cx="200" cy="200" r="180" fill="url(#cg-glow)" />

          {/* Stars */}
          {stars.map((s, i) => (
            <motion.circle
              key={`s${i}`}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              fill="white"
              animate={{ opacity: [0.1, 0.5, 0.1] }}
              transition={{
                duration: s.duration,
                delay: s.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Floating islands */}
          {islands.map((isl, i) => (
            <motion.ellipse
              key={`isl${i}`}
              cx={isl.cx}
              cy={isl.cy}
              rx={isl.rx}
              ry={isl.ry}
              fill={color}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.08, scale: 1 }}
              transition={{ duration: 1, delay: isl.delay, ease: "easeOut" }}
            />
          ))}

          {/* Drifting clouds */}
          {clouds.map((c, i) => (
            <motion.ellipse
              key={`c${i}`}
              rx={c.width / 2}
              ry={c.height / 2}
              fill="white"
              filter="url(#cg-blur)"
              animate={{
                cx: [c.x, c.x + c.drift, c.x],
                cy: [c.y, c.y - 5, c.y],
                opacity: [0.03, 0.06, 0.03],
              }}
              transition={{
                duration: c.duration,
                delay: c.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Light orbs trail */}
          {orbs.map((o, i) => (
            <g key={`o${i}`}>
              {/* Glow */}
              <motion.circle
                cx={o.cx}
                cy={o.cy}
                r={o.r * 2.5}
                fill={color}
                filter="url(#cg-blur)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.08, 0.04] }}
                transition={{
                  duration: 2,
                  delay: o.pulseDelay + 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Core */}
              <motion.circle
                cx={o.cx}
                cy={o.cy}
                r={o.r}
                fill={color}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.5, 0.3], scale: [0, 1.1, 1] }}
                transition={{
                  duration: 0.8,
                  delay: o.delay,
                  ease: "easeOut",
                }}
              />
            </g>
          ))}

          {/* Bird silhouette */}
          <motion.g style={{ y: birdY }}>
            <motion.g
              animate={{ y: [-3, 3, -3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Bird glow */}
              <circle cx="200" cy="0" r="12" fill={color} opacity="0.1" filter="url(#cg-blur)" />
              {/* Wings */}
              <motion.path
                d="M200,0 L185,-4 Q175,-12 165,-8 M200,0 L215,-4 Q225,-12 235,-8"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 1, delay: 0.5 }}
              />
              {/* Body */}
              <motion.path
                d="M200,0 L193,-2 Q200,-5 207,-2 Z"
                fill={color}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 1, delay: 0.5 }}
              />
              {/* Tail streaks */}
              <motion.path
                d="M200,2 Q195,8 188,14 M200,2 Q200,10 200,16 M200,2 Q205,8 212,14"
                stroke={color}
                strokeWidth="0.8"
                strokeLinecap="round"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 0.25, pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
              />
            </motion.g>
          </motion.g>
        </svg>
      </motion.div>
    </div>
  );
}

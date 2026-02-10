"use client";

import { motion, MotionValue, useTransform } from "framer-motion";

interface Props {
  color: string;
  scrollProgress: MotionValue<number>;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function LivingTypographyArt({ color, scrollProgress }: Props) {
  const rotation = useTransform(scrollProgress, [0.2, 0.8], [-5, 5]);

  return (
    <div className="w-full aspect-square relative overflow-hidden">
      <motion.div style={{ rotate: rotation }} className="w-full h-full">
        <svg viewBox="0 0 400 400" className="w-full h-full" fill="none">
          <defs>
            <radialGradient id="typo-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.12" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="200" cy="200" r="185" fill="url(#typo-glow)" />

          {/* Scattered background letters */}
          {LETTERS.map((letter, i) => {
            const angle = (i / LETTERS.length) * Math.PI * 2;
            const radius = 60 + (i % 3) * 50;
            const cx = 200 + Math.cos(angle) * radius;
            const cy = 200 + Math.sin(angle) * radius;
            const size = 14 + (i % 4) * 6;
            return (
              <motion.text
                key={i}
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={size}
                fontWeight={i % 3 === 0 ? "bold" : "light"}
                fill={color}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: [0.03 + (i % 5) * 0.03, 0.08 + (i % 5) * 0.04, 0.03 + (i % 5) * 0.03],
                  y: [0, -5 - (i % 3) * 3, 0],
                }}
                transition={{
                  duration: 3 + (i % 4),
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
                style={{ fontFamily: "serif" }}
              >
                {letter}
              </motion.text>
            );
          })}

          {/* Central word composition */}
          {"BREATHE".split("").map((char, i) => {
            const x = 120 + i * 24;
            return (
              <motion.text
                key={`main${i}`}
                x={x}
                y="200"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="36"
                fontWeight="200"
                fill={color}
                initial={{ opacity: 0, y: 30, rotate: -15 + i * 5 }}
                animate={{ opacity: 0.6, y: 0, rotate: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.5 + i * 0.12,
                  type: "spring",
                  damping: 12,
                }}
                style={{ fontFamily: "serif" }}
              >
                {char}
              </motion.text>
            );
          })}

          {/* Decorative baseline and capline */}
          <motion.line
            x1="110" y1="220" x2="290" y2="220"
            stroke={color}
            strokeWidth="0.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 1.5, ease: "easeOut" }}
            opacity="0.2"
          />
          <motion.line
            x1="110" y1="178" x2="290" y2="178"
            stroke={color}
            strokeWidth="0.3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 1.7, ease: "easeOut" }}
            opacity="0.1"
          />

          {/* Floating serif details */}
          {[
            { x: 160, y: 140, w: 20 },
            { x: 240, y: 260, w: 16 },
            { x: 300, y: 150, w: 12 },
          ].map((s, i) => (
            <motion.g
              key={`serif${i}`}
              animate={{ y: [0, -4, 0], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
            >
              <line x1={s.x} y1={s.y} x2={s.x + s.w} y2={s.y} stroke={color} strokeWidth="2" opacity="0.15" />
              <line x1={s.x} y1={s.y} x2={s.x} y2={s.y + 4} stroke={color} strokeWidth="1" opacity="0.1" />
              <line x1={s.x + s.w} y1={s.y} x2={s.x + s.w} y2={s.y + 4} stroke={color} strokeWidth="1" opacity="0.1" />
            </motion.g>
          ))}
        </svg>
      </motion.div>
    </div>
  );
}

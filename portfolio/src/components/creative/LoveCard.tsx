"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { CreativeWork, loveTheme } from "@/lib/creativeWorks";

interface LoveCardProps {
  work: CreativeWork;
  index: number;
  onHover?: (id: string | null) => void;
}

export function LoveCard({ work, index, onHover }: LoveCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isBlossomed, setIsBlossomed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse position for subtle card tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
    setIsBlossomed(false);
    onHover?.(null);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(work.id);
    // Bloom after a moment of presence
    setTimeout(() => setIsBlossomed(true), 150);
  };

  const { colors, heartbeat } = loveTheme;

  return (
    <motion.div
      ref={cardRef}
      className="relative group cursor-pointer"
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-card-id={work.id}
    >
      {/* Card container */}
      <motion.div
        className="relative h-full min-h-[280px] rounded-3xl overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${colors.warmBlack}, #0d0d0d)`,
        }}
        animate={{
          scale: isHovered ? 1.02 : 1,
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Heartbeat glow border */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            boxShadow: `inset 0 0 0 1px ${work.color}30`,
          }}
          animate={{
            boxShadow: isHovered
              ? `inset 0 0 0 1.5px ${work.color}60, 0 0 40px ${work.color}20`
              : `inset 0 0 0 1px ${work.color}20`,
          }}
          transition={{ duration: 0.4 }}
        />

        {/* Bloom petals - appear on hover */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full blur-2xl"
              style={{
                width: 100 + i * 30,
                height: 100 + i * 30,
                backgroundColor: work.color,
                left: "50%",
                top: "50%",
                x: "-50%",
                y: "-50%",
              }}
              initial={{ scale: 0, opacity: 0, rotate: i * 72 }}
              animate={{
                scale: isBlossomed ? 1 + i * 0.2 : 0,
                opacity: isBlossomed ? 0.15 - i * 0.02 : 0,
                rotate: isBlossomed ? i * 72 + 15 : i * 72,
                x: isBlossomed
                  ? `calc(-50% + ${Math.cos((i * 72 * Math.PI) / 180) * 40}px)`
                  : "-50%",
                y: isBlossomed
                  ? `calc(-50% + ${Math.sin((i * 72 * Math.PI) / 180) * 40}px)`
                  : "-50%",
              }}
              transition={{
                duration: 0.6,
                delay: i * 0.05,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        {/* Ambient warmth */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${work.color}15, transparent 60%)`,
          }}
          animate={{
            opacity: isHovered ? 1 : 0.5,
          }}
        />

        {/* Content */}
        <div className="relative h-full p-6 flex flex-col justify-between z-10">
          {/* Top section */}
          <div>
            {/* Category tag */}
            <motion.div
              className="inline-flex items-center gap-2 mb-4"
              animate={{ y: isBlossomed ? -2 : 0 }}
            >
              <motion.span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: work.color }}
                animate={{
                  scale: heartbeat.scale,
                  opacity: heartbeat.opacity,
                }}
                transition={{
                  duration: heartbeat.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <span
                className="text-xs uppercase tracking-widest"
                style={{ color: `${work.color}cc` }}
              >
                {work.category}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h3
              className="text-2xl font-semibold text-white mb-2"
              animate={{
                y: isBlossomed ? -4 : 0,
              }}
              transition={{ duration: 0.4 }}
            >
              {work.title}
            </motion.h3>

            {/* Subtitle - blooms into view */}
            <motion.p
              className="text-white/50 text-sm italic"
              initial={{ opacity: 0.6 }}
              animate={{
                opacity: isBlossomed ? 1 : 0.6,
                y: isBlossomed ? -2 : 0,
              }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {work.subtitle}
            </motion.p>
          </div>

          {/* Bottom section - blooms open */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: isBlossomed ? 1 : 0,
              y: isBlossomed ? 0 : 20,
            }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {/* Description */}
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              {work.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {work.tags.map((tag, i) => (
                <motion.span
                  key={tag}
                  className="px-2.5 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: `${work.color}15`,
                    color: `${work.color}dd`,
                    border: `1px solid ${work.color}30`,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isBlossomed ? 1 : 0,
                    scale: isBlossomed ? 1 : 0.8,
                  }}
                  transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Enter prompt */}
          <motion.div
            className="absolute bottom-6 right-6 flex items-center gap-2"
            style={{ color: work.color }}
            initial={{ opacity: 0, x: 10 }}
            animate={{
              opacity: isBlossomed ? 0.8 : 0,
              x: isBlossomed ? 0 : 10,
            }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <span className="text-xs">Enter</span>
            <motion.svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ x: isBlossomed ? [0, 4, 0] : 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </motion.svg>
          </motion.div>
        </div>

        {/* Shimmer effect on hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${work.color}10 50%, transparent 60%)`,
            backgroundSize: "200% 100%",
          }}
          animate={{
            backgroundPosition: isHovered ? ["200% 0%", "-200% 0%"] : "200% 0%",
          }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

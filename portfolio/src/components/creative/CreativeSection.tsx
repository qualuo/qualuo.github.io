"use client";

import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { CreativeWork } from "@/lib/creativeWorks";
import { SectionArtwork, OrnateFrame } from "./artworks";

interface CreativeSectionProps {
  work: CreativeWork;
  index: number;
  onActive?: () => void;
}

export function CreativeSection({
  work,
  index,
  onActive,
}: CreativeSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isEven = index % 2 === 0;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Track when this section is active
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value) => {
      if (value > 0.3 && value < 0.7 && onActive) onActive();
    });
    return () => unsubscribe();
  }, [scrollYProgress, onActive]);

  // Spring configs
  const snappy = { stiffness: 300, damping: 30, mass: 0.8 };
  const smooth = { stiffness: 120, damping: 20, mass: 0.8 };

  // Clip-path reveal (circle expanding from center)
  const clipRadius = useTransform(scrollYProgress, [0.05, 0.3], [0, 100]);
  const clipPath = useTransform(clipRadius, (r) => `circle(${r}% at 50% 50%)`);

  // Background atmosphere
  const rawBgOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 0.9, 0.9, 0]);
  const bgOpacity = useSpring(rawBgOpacity, snappy);

  // Content transforms
  const rawContentOpacity = useTransform(scrollYProgress, [0.15, 0.35, 0.65, 0.85], [0, 1, 1, 0]);
  const contentOpacity = useSpring(rawContentOpacity, snappy);
  const rawContentY = useTransform(scrollYProgress, [0.15, 0.35], [60, 0]);
  const contentY = useSpring(rawContentY, smooth);

  // Artwork transforms
  const rawArtworkOpacity = useTransform(scrollYProgress, [0.12, 0.3, 0.7, 0.88], [0, 1, 1, 0]);
  const artworkOpacity = useSpring(rawArtworkOpacity, snappy);
  const rawArtworkScale = useTransform(scrollYProgress, [0.12, 0.35, 0.65, 0.88], [0.85, 1, 1, 0.9]);
  const artworkScale = useSpring(rawArtworkScale, smooth);
  const artworkParallax = useTransform(scrollYProgress, [0, 1], [80, -80]);

  // Parallax decorative elements
  const parallax1 = useTransform(scrollYProgress, [0, 1], [120, -120]);
  const parallax2 = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const parallax3 = useTransform(scrollYProgress, [0, 1], [-60, 60]);

  // Stagger transforms for text
  const rawSubtitleOpacity = useTransform(scrollYProgress, [0.2, 0.38, 0.62, 0.8], [0, 1, 1, 0]);
  const subtitleOpacity = useSpring(rawSubtitleOpacity, snappy);
  const rawDescOpacity = useTransform(scrollYProgress, [0.25, 0.4, 0.6, 0.78], [0, 1, 1, 0]);
  const descOpacity = useSpring(rawDescOpacity, snappy);

  const words = work.title.split(" ");

  return (
    <div ref={containerRef} className="relative h-[150vh]">
      {/* Sticky container */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Clip-path reveal layer */}
        <motion.div className="absolute inset-0" style={{ clipPath }}>
          {/* Background radial glow */}
          <motion.div
            className="absolute inset-0"
            style={{
              opacity: bgOpacity,
              background: `radial-gradient(ellipse at ${isEven ? "30%" : "70%"} 50%, ${work.bgColor}dd 0%, ${work.bgColor}44 40%, transparent 70%)`,
            }}
          />
          <motion.div
            className="absolute inset-0"
            style={{
              opacity: bgOpacity,
              background: `radial-gradient(circle at ${isEven ? "70%" : "30%"} 60%, ${work.color}08 0%, transparent 50%)`,
            }}
          />
        </motion.div>


        {/* Parallax decorative shapes */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            y: parallax1,
            top: "10%",
            right: isEven ? "8%" : undefined,
            left: isEven ? undefined : "8%",
          }}
        >
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="58" stroke={work.color} strokeWidth="0.5" opacity="0.06" />
            <circle cx="60" cy="60" r="40" stroke={work.color} strokeWidth="0.3" opacity="0.04" />
            <circle cx="60" cy="60" r="20" stroke={work.color} strokeWidth="0.3" opacity="0.03" />
          </svg>
        </motion.div>

        <motion.div
          className="absolute pointer-events-none"
          style={{
            y: parallax2,
            bottom: "25%",
            left: isEven ? "3%" : undefined,
            right: isEven ? undefined : "3%",
          }}
        >
          <svg width="80" height="2" viewBox="0 0 80 2">
            <line x1="0" y1="1" x2="80" y2="1" stroke={work.color} strokeWidth="0.5" opacity="0.15" />
          </svg>
        </motion.div>

        <motion.div
          className="absolute pointer-events-none"
          style={{
            y: parallax3,
            top: "55%",
            right: isEven ? "15%" : undefined,
            left: isEven ? undefined : "15%",
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" fill={work.color} opacity="0.2" />
          </svg>
        </motion.div>

        {/* === Main two-column layout === */}
        <div className={`absolute inset-0 flex items-center ${isEven ? "" : "flex-row-reverse"}`}>
          {/* Text column */}
          <motion.div
            className="relative z-10 w-full lg:w-1/2 px-8 md:px-12 lg:px-16"
            style={{ opacity: contentOpacity, y: contentY }}
          >
            {/* Title with gradient on last word */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 leading-[1.1]" style={{ perspective: "600px" }}>
              {words.map((word, wi) => {
                const isLastWord = wi === words.length - 1;
                return (
                  <span key={wi} className="inline-block mr-[0.3em]">
                    <span
                      style={
                        isLastWord
                          ? {
                              background: `linear-gradient(135deg, ${work.color}, ${work.color}aa)`,
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              fontWeight: 600,
                            }
                          : undefined
                      }
                    >
                      {word}
                    </span>
                  </span>
                );
              })}
            </h2>

            {/* Subtitle */}
            <motion.p
              className="text-lg md:text-xl text-white/50 italic mb-6"
              style={{ opacity: subtitleOpacity }}
            >
              {work.subtitle}
            </motion.p>

            {/* Description */}
            <motion.p
              className="text-base md:text-lg text-white/40 leading-relaxed max-w-lg mb-8"
              style={{ opacity: descOpacity }}
            >
              {work.description}
            </motion.p>

          </motion.div>

          {/* Artwork column (desktop) */}
          <motion.div
            className="hidden lg:flex w-1/2 items-center justify-center px-8"
            style={{ y: artworkParallax }}
          >
            <OrnateFrame
              color={work.color}
              opacity={artworkOpacity}
              scale={artworkScale}
              className="w-full max-w-md"
            >
              <SectionArtwork
                workId={work.id}
                color={work.color}
                scrollProgress={scrollYProgress}
              />
            </OrnateFrame>
          </motion.div>
        </div>

        {/* Mobile artwork (smaller, bottom-right) */}
        <motion.div
          className="lg:hidden absolute bottom-20 right-6 w-32 h-32"
          style={{ opacity: artworkOpacity, scale: artworkScale }}
        >
          <SectionArtwork
            workId={work.id}
            color={work.color}
            scrollProgress={scrollYProgress}
          />
        </motion.div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1C1917] to-transparent pointer-events-none" />

      </div>
    </div>
  );
}

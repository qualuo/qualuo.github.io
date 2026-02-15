"use client";

import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import { CreativeWork } from "@/lib/creativeWorks";
import { SectionArtwork } from "./artworks";

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
          {/* Background radial glow — single subtle layer */}
          <motion.div
            className="absolute inset-0"
            style={{
              opacity: bgOpacity,
              background: `radial-gradient(ellipse at ${isEven ? "30%" : "70%"} 50%, ${work.bgColor}ee 0%, ${work.bgColor}66 35%, transparent 65%)`,
            }}
          />
        </motion.div>

        {/* === Main two-column layout === */}
        <div className={`absolute inset-0 flex items-center ${isEven ? "" : "flex-row-reverse"}`}>
          {/* Text column */}
          <motion.div
            className="relative z-10 w-full lg:w-1/2 px-8 md:px-12 lg:px-16"
            style={{ opacity: contentOpacity, y: contentY }}
          >
            {/* Title with gradient on last word */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 leading-[1.1]">
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

            {/* CTA link */}
            {work.href && (
              <motion.div style={{ opacity: descOpacity }}>
                <Link
                  href={work.href}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm tracking-wide transition-all border"
                  style={{
                    color: work.color,
                    borderColor: `${work.color}30`,
                    backgroundColor: `${work.color}08`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${work.color}60`;
                    e.currentTarget.style.backgroundColor = `${work.color}15`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${work.color}30`;
                    e.currentTarget.style.backgroundColor = `${work.color}08`;
                  }}
                >
                  Experience
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </motion.div>
            )}

          </motion.div>

          {/* Artwork column (desktop) */}
          <motion.div
            className="hidden lg:flex w-1/2 items-center justify-center px-8"
            style={{ y: artworkParallax, opacity: artworkOpacity, scale: artworkScale }}
          >
            <div
              className="w-full max-w-md rounded-lg overflow-hidden"
              style={{ border: `1px solid ${work.color}20` }}
            >
              <SectionArtwork
                workId={work.id}
                color={work.color}
                scrollProgress={scrollYProgress}
              />
            </div>
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

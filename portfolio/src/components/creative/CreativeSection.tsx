"use client";

import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { CreativeWork } from "@/lib/creativeWorks";
import { SectionArtwork, hasArtwork } from "./artworks";

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

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value) => {
      if (value > 0.3 && value < 0.7 && onActive) onActive();
    });
    return () => unsubscribe();
  }, [scrollYProgress, onActive]);

  const bgOpacity = useTransform(scrollYProgress, [0.1, 0.3, 0.7, 0.9], [0, 0.9, 0.9, 0]);
  const artworkParallax = useTransform(scrollYProgress, [0, 1], [40, -40]);

  const showArt = hasArtwork(work.id);
  const words = work.title.split(" ");

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  };

  return (
    <div ref={containerRef} className="relative py-24 md:py-32 overflow-hidden">
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: bgOpacity,
          background: `radial-gradient(ellipse at ${isEven ? "30%" : "70%"} 50%, ${work.bgColor}ee 0%, ${work.bgColor}66 35%, transparent 65%)`,
        }}
      />

      <motion.div
        className={`relative z-10 max-w-6xl mx-auto px-8 md:px-12 flex items-center gap-12 ${isEven ? "" : "flex-row-reverse"}`}
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
      >
        {/* Text */}
        <div className={`w-full ${showArt ? "lg:w-1/2" : ""}`}>
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 leading-[1.1]"
            variants={fadeUp}
          >
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
          </motion.h2>

          <motion.p className="text-lg md:text-xl text-white/50 italic mb-6" variants={fadeUp}>
            {work.subtitle}
          </motion.p>

          <motion.p className="text-base md:text-lg text-white/40 leading-relaxed max-w-lg mb-8" variants={fadeUp}>
            {work.description}
          </motion.p>

          {work.href && (
            <motion.div variants={fadeUp}>
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
        </div>

        {/* Artwork */}
        {showArt && (
          <motion.div
            className="hidden lg:flex w-1/2 items-center justify-center"
            style={{ y: artworkParallax }}
            variants={fadeUp}
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
        )}
      </motion.div>

      {/* Mobile artwork */}
      {showArt && (
        <motion.div
          className="lg:hidden mt-8 px-8"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-40 h-40 mx-auto">
            <SectionArtwork
              workId={work.id}
              color={work.color}
              scrollProgress={scrollYProgress}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}

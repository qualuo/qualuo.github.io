"use client";

import { useRef, useState, useEffect, useSyncExternalStore } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import { creativeWorks, loveTheme } from "@/lib/creativeWorks";
import { CreativeScene } from "@/components/creative/CreativeScene";
import { CreativeSection } from "@/components/creative/CreativeSection";
import { CreativeNav } from "@/components/creative/CreativeNav";

const emptySubscribe = () => () => {};

export default function CreativeClient() {
  const mainRef = useRef<HTMLElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Global scroll progress across the entire page
  const { scrollYProgress } = useScroll({
    target: mainRef,
    offset: ["start start", "end end"],
  });

  // Mutable ref for R3F scene (avoids React re-renders)
  const scrollProgressRef = useRef(0);
  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      scrollProgressRef.current = v;
    });
  }, [scrollYProgress]);

  // Pointer tracking for WebGL mouse reactivity
  const pointerRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", handler, { passive: true });
    return () => window.removeEventListener("pointermove", handler);
  }, []);

  const sectionColors = creativeWorks.map((w) => w.particleColor);
  const { colors } = loveTheme;

  const handleNavigate = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
  };

  // Hero section animations
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(heroProgress, [0, 0.8], [0, -80]);
  const heroScale = useTransform(heroProgress, [0, 0.8], [1, 0.95]);

  // Scroll indicator bounce
  const scrollIndicatorY = useSpring(
    useTransform(heroProgress, [0, 0.3], [0, 20]),
    { stiffness: 100, damping: 10 },
  );
  const scrollIndicatorOpacity = useTransform(heroProgress, [0, 0.2], [1, 0]);

  return (
    <main ref={mainRef} id="main-content" className="relative" style={{ backgroundColor: colors.warmBlack }}>
      {/* Fixed back navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-40 p-6"
        style={{
          background: `linear-gradient(to bottom, ${colors.warmBlack}, ${colors.warmBlack}ee 50%, transparent)`,
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/50 hover:text-white/90 transition-colors group"
          >
            <svg
              className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="text-sm">Return</span>
          </Link>

          {/* Pulse indicator */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.warmBlush }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: loveTheme.heartbeat.duration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <span className="text-white/30 text-xs tracking-widest uppercase">
              Alive
            </span>
          </motion.div>

          <div className="w-16" />
        </div>
      </motion.nav>

      {/* ===== Hero Section ===== */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center z-10">
        <motion.div
          className="text-center px-6"
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full mb-8"
            style={{
              backgroundColor: `${colors.deepRose}15`,
              border: `1px solid ${colors.deepRose}30`,
            }}
          >
            <motion.span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.warmBlush }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: loveTheme.heartbeat.duration,
                repeat: Infinity,
              }}
            />
            <span className="text-sm tracking-wide" style={{ color: colors.warmBlush }}>
              Creative Portal
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-light text-white mb-6 leading-[1.1]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Made with
            <br />
            <span
              className="font-semibold"
              style={{
                background: `linear-gradient(135deg, ${colors.warmBlush}, ${colors.softGold})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Love
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-lg md:text-xl text-white/40 leading-relaxed max-w-lg mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Experiments in connection, expression, and craft
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ opacity: scrollIndicatorOpacity, y: scrollIndicatorY }}
        >
          <span className="text-white/20 text-xs tracking-widest uppercase">
            Scroll
          </span>
          <motion.svg
            className="w-5 h-5 text-white/20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 14l-7 7m0 0l-7-7"
            />
          </motion.svg>
        </motion.div>
      </section>

      {/* ===== Creative Work Sections ===== */}
      {creativeWorks.map((work, index) => (
        <div
          key={work.id}
          ref={(el) => {
            sectionRefs.current[index] = el;
          }}
        >
          <CreativeSection
            work={work}
            index={index}
            onActive={() => setActiveIndex(index)}
          />
        </div>
      ))}

      {/* ===== Closing Section ===== */}
      <section className="relative h-screen flex items-center justify-center z-10">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-white/20 text-sm mb-4">
            {creativeWorks.length} expressions of care
          </p>
          <motion.div
            className="flex items-center justify-center gap-3"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-8 h-px" style={{ backgroundColor: colors.deepRose }} />
            <svg
              className="w-4 h-4"
              style={{ color: colors.warmBlush }}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <div className="w-8 h-px" style={{ backgroundColor: colors.deepRose }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== Navigation ===== */}
      <CreativeNav
        works={creativeWorks}
        scrollProgress={scrollYProgress}
        activeIndex={activeIndex}
        onNavigate={handleNavigate}
      />

      {/* ===== WebGL Background ===== */}
      {mounted && (
        <CreativeScene
          scrollProgressRef={scrollProgressRef}
          pointerRef={pointerRef}
          sectionCount={creativeWorks.length}
          sectionColors={sectionColors}
        />
      )}
    </main>
  );
}

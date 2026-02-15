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
          <div className="w-16" />
        </div>
      </motion.nav>

      {/* ===== Hero Section ===== */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center z-10 overflow-hidden">
        {/* Ambient radial glow */}
        <motion.div
          className="absolute pointer-events-none"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2.5, delay: 0.3, ease: "easeOut" }}
          style={{
            width: "min(700px, 90vw)",
            height: "min(700px, 90vw)",
            background: `radial-gradient(circle, ${colors.blossom}20 0%, ${colors.lavender}12 30%, ${colors.warmBlush}08 55%, transparent 70%)`,
            animation: "glowPulse 8s ease-in-out infinite",
          }}
        />

        {/* Floating petals */}
        {[
          { x: "12%", y: "25%", size: 5, color: colors.blossom, delay: 0, dur: 14 },
          { x: "82%", y: "20%", size: 4, color: colors.lavender, delay: 2, dur: 16 },
          { x: "25%", y: "70%", size: 6, color: colors.softGold, delay: 1, dur: 12 },
          { x: "75%", y: "65%", size: 4, color: colors.warmBlush, delay: 3, dur: 18 },
          { x: "50%", y: "15%", size: 3, color: colors.lavender, delay: 4, dur: 15 },
          { x: "90%", y: "50%", size: 5, color: colors.blossom, delay: 1.5, dur: 13 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: 2, delay: 1.5 + p.delay * 0.3 }}
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size * 1.4,
              background: p.color,
              borderRadius: "50% 50% 50% 0%",
              filter: "blur(1px)",
              animation: `petalFloat${i % 3} ${p.dur}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

        <motion.div
          className="text-center px-6 relative z-10"
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
        >
          {/* Title — staggered word entrance */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light text-white/80 mb-4 leading-[1.1]">
            <motion.span
              className="inline-block"
              initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            >
              Made with
            </motion.span>
            <br />
            <motion.span
              className="inline-block font-semibold relative"
              initial={{ opacity: 0, y: 50, scale: 0.8, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
              style={{
                background: `linear-gradient(135deg, ${colors.blossom}, ${colors.warmBlush}, ${colors.peach}, ${colors.lavender})`,
                backgroundSize: "300% 300%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "gradientShift 6s ease infinite",
              }}
            >
              Love
            </motion.span>
          </h1>

          {/* Decorative heart */}
          <motion.svg
            width="24"
            height="22"
            viewBox="0 0 24 22"
            className="mx-auto mb-5"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ delay: 0.9, duration: 1, ease: "easeOut" }}
          >
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill={colors.warmBlush}
              opacity="0.6"
            />
          </motion.svg>

          {/* Subtitle */}
          <motion.p
            className="text-lg md:text-xl text-white/40 leading-relaxed max-w-lg mx-auto tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            Where feelings take root and bloom
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ opacity: scrollIndicatorOpacity, y: scrollIndicatorY }}
        >
          <span className="text-white/20 text-xs tracking-widest uppercase">
            Wander
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

      {/* CSS keyframes */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes glowPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes petalFloat0 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(12px, -18px) rotate(15deg); }
          66% { transform: translate(-8px, -10px) rotate(-10deg); }
        }
        @keyframes petalFloat1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-15px, -12px) rotate(-20deg); }
          66% { transform: translate(10px, -20px) rotate(12deg); }
        }
        @keyframes petalFloat2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(8px, -22px) rotate(10deg); }
          66% { transform: translate(-12px, -8px) rotate(-15deg); }
        }
      `}</style>

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
      <section className="relative h-[60vh] flex items-center justify-center z-10">
        <motion.div
          className="text-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
        >
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="w-16 h-px bg-white/8" />
            <span className="text-white/20 text-xs tracking-[0.3em] uppercase">
              {creativeWorks.length} experiences
            </span>
            <div className="w-16 h-px bg-white/8" />
          </div>
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

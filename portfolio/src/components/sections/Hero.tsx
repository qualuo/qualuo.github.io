"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useCallback, useEffect } from "react";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { DelicateAccent } from "@/components/animations/DelicateAccent";
import { usePolarisParallax } from "@/hooks/usePolarisParallax";

const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 60 : -60,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -60 : 60,
  }),
};

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [[slide, direction], setSlide] = useState([0, 0]);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.4], [0, -60]);

  const totalSlides = 3;

  const navigate = useCallback((newDirection: number) => {
    setSlide(([prev]) => {
      const next = prev + newDirection;
      if (next < 0) return [totalSlides - 1, newDirection];
      if (next >= totalSlides) return [0, newDirection];
      return [next, newDirection];
    });
  }, []);

  // Swipe handling
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!pointerStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    pointerStart.current = null;
    // Only trigger if horizontal swipe is dominant and exceeds threshold
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      navigate(dx < 0 ? 1 : -1);
    }
  }, [navigate]);

  const scrollToContact = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.querySelector("#contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('hero-slide-change', { detail: { slide } }));
  }, [slide]);

  const { x: bloomX, y: bloomY } = usePolarisParallax();

  return (
    <section
      ref={containerRef}
      id="hero"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      className="relative z-10 min-h-dvh flex flex-col items-center justify-center overflow-hidden touch-pan-y pt-20 md:pt-0"
    >
      {/* Geometric accent — fixed to viewport, tracks Polaris through mouse parallax */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{ x: bloomX, y: bloomY }}
        initial={{ scale: 0.92 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.2, delay: 0.1, ease }}
      >
        <div className="absolute w-80 h-80 md:w-120 md:h-120 -translate-x-1/2 -translate-y-1/2" style={{ left: "42%", top: "28%" }}>
          <DelicateAccent variant="goldenbloom" />
        </div>
      </motion.div>

      <motion.div
        style={{ opacity, y }}
        className="relative z-10 text-center px-6 max-w-5xl w-full"
      >
        <AnimatePresence mode="wait" custom={direction}>
          {slide === 0 && (
            <motion.div
              key="architect"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease }}
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease }}
                className="text-sky-400 text-sm md:text-base font-medium tracking-widest uppercase mb-6"
              >
                Systems Architect · Intelligent Automation
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight mb-8"
              >
                <span className="inline-block text-white">Quang Luong</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4, ease }}
                className="text-xl md:text-2xl lg:text-3xl text-slate-400 font-light max-w-3xl mx-auto leading-relaxed mb-12"
              >
                I design AI solutions and automation platforms
                <span className="text-white"> that transform how organizations operate</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6, ease }}
                className="flex flex-wrap justify-center gap-8 md:gap-16 mb-16"
              >
                {[
                  { value: "Enterprise & Startup", label: "Experience" },
                  { value: "Public & Private", label: "Sectors" },
                  { value: "10+ Years", label: "Crafting Software" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl md:text-3xl font-semibold text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8, ease }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <MagneticButton strength={0.15}>
                  <Link href="/demos" data-cursor="pointer">
                    <motion.span
                      className="inline-block px-8 py-4 bg-white text-black font-medium rounded-full hover:bg-gray-100 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Explore
                    </motion.span>
                  </Link>
                </MagneticButton>
                <MagneticButton strength={0.15}>
                  <motion.a
                    href="#contact"
                    onClick={scrollToContact}
                    data-cursor="pointer"
                    className="inline-block px-8 py-4 border border-white/20 text-white font-medium rounded-full hover:bg-white/5 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Get in Touch
                  </motion.a>
                </MagneticButton>
              </motion.div>
            </motion.div>
          )}

          {slide === 1 && (
            <motion.div
              key="creative"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease }}
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease }}
                className="text-purple-400 text-sm md:text-base font-medium tracking-widest uppercase mb-6"
              >
                Creative Technologist · Interaction Design
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight mb-8"
              >
                <span className="inline-block text-white">Quang Luong</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4, ease }}
                className="text-xl md:text-2xl lg:text-3xl text-slate-400 font-light max-w-3xl mx-auto leading-relaxed mb-12"
              >
                I craft digital experiences and interactive visuals
                <span className="text-white"> that blur the line between art and technology</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6, ease }}
                className="flex flex-wrap justify-center gap-8 md:gap-16 mb-16"
              >
                {[
                  { value: "Motion & 3D", label: "Specialization" },
                  { value: "Web & Interactive", label: "Medium" },
                  { value: "Pixels to Purpose", label: "Philosophy" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl md:text-3xl font-semibold text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8, ease }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <MagneticButton strength={0.15}>
                  <Link href="/work" data-cursor="pointer">
                    <motion.span
                      className="inline-block px-8 py-4 bg-white text-black font-medium rounded-full hover:bg-gray-100 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Engage
                    </motion.span>
                  </Link>
                </MagneticButton>
                <MagneticButton strength={0.15}>
                  <motion.a
                    href="#contact"
                    onClick={scrollToContact}
                    data-cursor="pointer"
                    className="inline-block px-8 py-4 border border-white/20 text-white font-medium rounded-full hover:bg-white/5 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Collaborate
                  </motion.a>
                </MagneticButton>
              </motion.div>
            </motion.div>
          )}

          {slide === 2 && (
            <motion.div
              key="zen"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease }}
              className="min-h-100"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Left arrow */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        whileHover={{ opacity: 0.6 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.3 }}
        onClick={() => navigate(-1)}
        className="absolute left-6 top-1/2 -translate-y-1/2 p-3 cursor-pointer z-20"
        aria-label="Previous"
        data-cursor="pointer"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </motion.button>

      {/* Right arrow */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        whileHover={{ opacity: 0.6 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.3 }}
        onClick={() => navigate(1)}
        className="absolute right-6 top-1/2 -translate-y-1/2 p-3 cursor-pointer z-20"
        aria-label="Next"
        data-cursor="pointer"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </motion.button>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {[0, 1, 2].map((i) => (
          <motion.button
            key={i}
            onClick={() => setSlide([i, i > slide ? 1 : -1])}
            className="w-1.5 h-1.5 rounded-full cursor-pointer"
            animate={{
              backgroundColor: slide === i ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)",
              scale: slide === i ? 1.3 : 1,
            }}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.3)" }}
            transition={{ duration: 0.3 }}
            aria-label={`Go to slide ${i + 1}`}
            data-cursor="pointer"
          />
        ))}
      </div>
    </section>
  );
}

"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll } from "framer-motion";
import Image from "next/image";
import { projects, Project, categoryThemes } from "@/lib/projects";
import { ProjectHero } from "@/components/projects/ProjectHero";
import { ProjectProgress } from "@/components/projects/ProjectProgress";
import { AbstractVisual } from "@/components/projects/visuals/AbstractVisual";

const AUTO_SCROLL_SPEED = 0.8; // desktop: pixels per frame (~48px/s at 60fps)
const AUTO_SCROLL_SPEED_MOBILE = 1.6; // mobile: faster (~96px/s at 60fps)
const IDLE_RESUME_MS = 30_000; // 30 seconds

// Mobile project card component
function MobileProjectCard({ project, index, onActive }: { project: Project; index: number; onActive?: () => void }) {
  const theme = categoryThemes[project.category] || categoryThemes["AI & Innovation"];
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value) => {
      if (value > 0.3 && value < 0.7 && onActive) {
        onActive();
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, onActive]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="min-h-screen flex flex-col relative"
    >
      {/* Visual - Top portion */}
      <div className="h-[45vh] relative overflow-hidden">
        {project.media ? (
          project.media.type === "video" ? (
            <video
              src={project.media.src}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              autoPlay
            />
          ) : (
            <Image
              src={project.media.src}
              alt={project.title}
              fill
              className="object-cover"
              unoptimized
            />
          )
        ) : project.visualConfig ? (
          <AbstractVisual
            type={project.visualConfig.type}
            colors={project.visualConfig.colors}
            scrollProgress={scrollYProgress}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `radial-gradient(ellipse at center, ${theme.primary}30, ${theme.secondary}15, transparent)`,
            }}
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black pointer-events-none" />
      </div>

      {/* Content - Bottom portion */}
      <div className="flex-1 px-6 py-8 bg-black">
        {/* Category */}
        <span
          className="text-xs font-medium tracking-widest uppercase"
          style={{ color: theme.primary }}
        >
          {project.category}
        </span>

        {/* Title */}
        <h3 className="text-2xl font-bold text-white mt-2 mb-4">
          {project.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-white/60 mb-4 line-clamp-3">
          {project.description}
        </p>

        {/* Impact */}
        {project.impact && (
          <p
            className="text-sm font-medium mb-4"
            style={{ color: theme.primary }}
          >
            {project.impact}
          </p>
        )}

        {/* Tech stack */}
        <div className="flex flex-wrap gap-2">
          {project.tech.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 text-xs rounded-full border border-white/20 text-white/70"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Project number */}
      <div
        className="absolute top-4 right-4 text-6xl font-bold select-none"
        style={{ color: `${theme.primary}20` }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
    </motion.div>
  );
}

export function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Auto-scroll with loop — pauses on user interaction, resumes after 30s idle
  useEffect(() => {
    let rafId: number | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let paused = false;
    let looping = false; // true while smooth-scrolling back to top

    const tick = () => {
      if (paused || looping) return;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      if (window.scrollY >= maxScroll - 2) {
        // Reached bottom — loop to top
        looping = true;
        window.scrollTo({ top: 0, behavior: "smooth" });
        // Resume auto-scroll after the smooth scroll finishes
        setTimeout(() => {
          looping = false;
          if (!paused) rafId = requestAnimationFrame(tick);
        }, 1500);
        return;
      }

      const speed = window.innerWidth < 1024 ? AUTO_SCROLL_SPEED_MOBILE : AUTO_SCROLL_SPEED;
      window.scrollBy(0, speed);
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      paused = false;
      looping = false;
      rafId = requestAnimationFrame(tick);
    };

    const pause = () => {
      paused = true;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(start, IDLE_RESUME_MS);
    };

    // Start after a brief delay so the page can settle
    const initTimer = setTimeout(start, 2000);

    // User-initiated events that pause auto-scroll
    const events: (keyof WindowEventMap)[] = [
      "wheel", "touchstart", "touchmove", "pointerdown", "keydown",
    ];
    events.forEach((e) => window.addEventListener(e, pause, { passive: true }));

    return () => {
      clearTimeout(initTimer);
      paused = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach((e) => window.removeEventListener(e, pause));
    };
  }, []);

  return (
    <section ref={sectionRef} id="projects" className="relative bg-black">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="h-screen flex items-center justify-center relative"
      >
        <div className="text-center max-w-4xl px-6">
          <motion.h2
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Selected Work
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl text-white/50"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            From enterprise AI platforms to interactive experiences
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Progress Indicator (both mobile + desktop) */}
      <ProjectProgress
        projects={projects}
        scrollProgress={scrollYProgress}
        activeIndex={activeIndex}
      />

      {/* Desktop: Cinematic scroll experience */}
      <div className="hidden lg:block">
        {projects.map((project, index) => (
          <ProjectHero
            key={project.id}
            project={project}
            index={index}
            onActive={() => setActiveIndex(index)}
          />
        ))}
      </div>

      {/* Mobile: Simplified card layout */}
      <div className="lg:hidden">
        {projects.map((project, index) => (
          <MobileProjectCard key={project.id} project={project} index={index} onActive={() => setActiveIndex(index)} />
        ))}
      </div>
    </section>
  );
}

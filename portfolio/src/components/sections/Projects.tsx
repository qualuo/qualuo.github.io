"use client";

import { useRef, useState, useEffect, useCallback, useSyncExternalStore, lazy, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll } from "framer-motion";
import Image from "next/image";
import { projects, Project, categoryThemes } from "@/lib/projects";
import { ProjectHero } from "@/components/projects/ProjectHero";
import { ProjectProgress } from "@/components/projects/ProjectProgress";
import { DelicateAccent } from "@/components/animations/DelicateAccent";

const AbstractVisual = lazy(() =>
  import("@/components/projects/visuals/AbstractVisual").then(m => ({ default: m.AbstractVisual }))
);

// Defer Three.js (~2MB) — loads after initial paint instead of blocking it
const ProjectsWebGL = dynamic(
  () => import("@/components/projects/ProjectsWebGL").then(m => ({ default: m.ProjectsWebGL })),
  { ssr: false }
);

const ease = [0.23, 1, 0.32, 1] as const;
const AUTO_SCROLL_VH_S = 5; // desktop: % of viewport height per second
const AUTO_SCROLL_VH_S_MOBILE = 12; // mobile: % of viewport height per second
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
          <Suspense fallback={
            <div className="w-full h-full" style={{ background: `radial-gradient(ellipse at center, ${theme.primary}30, ${theme.secondary}15, transparent)` }} />
          }>
            <AbstractVisual
              type={project.visualConfig.type}
              colors={project.visualConfig.colors}
            />
          </Suspense>
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

const emptySubscribe = () => () => {};

export function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const desktopRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mobileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pauseAutoScroll = useRef<(() => void) | null>(null);
  const loopOverlayRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const handleNavigate = useCallback((index: number) => {
    const isMobile = window.innerWidth < 1024;
    const el = isMobile ? mobileRefs.current[index] : desktopRefs.current[index];
    if (!el) return;
    pauseAutoScroll.current?.();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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
    let lastTime: number | null = null;

    const tick = (now: number) => {
      if (paused || looping) return;

      const dt = lastTime ? (now - lastTime) / 1000 : 0; // seconds since last frame
      lastTime = now;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      if (window.scrollY >= maxScroll - 2) {
        // Reached bottom — fade to black, jump to top, fade back in
        looping = true;
        lastTime = null;
        const overlay = loopOverlayRef.current;
        if (overlay) {
          overlay.style.transition = "opacity 0.6s ease-in";
          overlay.style.opacity = "1";
        }
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
          setTimeout(() => {
            if (overlay) {
              overlay.style.transition = "opacity 0.6s ease-out";
              overlay.style.opacity = "0";
            }
            setTimeout(() => {
              looping = false;
              if (!paused) rafId = requestAnimationFrame(tick);
            }, 600);
          }, 100);
        }, 600);
        return;
      }

      const vhRate = window.innerWidth < 1024 ? AUTO_SCROLL_VH_S_MOBILE : AUTO_SCROLL_VH_S;
      window.scrollBy(0, (vhRate / 100) * window.innerHeight * dt);
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      paused = false;
      looping = false;
      lastTime = null;
      rafId = requestAnimationFrame(tick);
    };

    const pause = () => {
      paused = true;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(start, IDLE_RESUME_MS);
    };
    pauseAutoScroll.current = pause;

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
      pauseAutoScroll.current = null;
      if (rafId) cancelAnimationFrame(rafId);
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach((e) => window.removeEventListener(e, pause));
    };
  }, []);

  return (
    <section ref={sectionRef} id="projects" className="relative bg-black">
      {/* Section Header */}
      <div className="h-screen flex items-center justify-center relative z-2">
        <div className="relative z-10 text-center max-w-4xl px-6">
          <motion.p
            className="text-xs uppercase tracking-[0.2em] text-white/40 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
          >
            Portfolio
          </motion.p>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            {"Selected Work".split(" ").map((word, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.12, ease }}
              >
                {word}
                {i === 0 ? "\u00A0" : ""}
              </motion.span>
            ))}
          </h2>

          <motion.p
            className="text-lg md:text-xl text-white/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease }}
          >
            From enterprise AI platforms to interactive experiences
          </motion.p>
        </div>

        {/* Delicate geometric accent — timeline behind text */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.1, ease }}
        >
          <div className="w-80 h-[80vh]">
            <DelicateAccent variant="timeline" />
          </div>
        </motion.div>

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

      {/* Progress Indicator (both mobile + desktop) */}
      <ProjectProgress
        projects={projects}
        scrollProgress={scrollYProgress}
        activeIndex={activeIndex}
        onNavigate={handleNavigate}
      />

      {/* Desktop: Cinematic scroll experience */}
      <div className="hidden lg:block relative z-2">
        {projects.map((project, index) => (
          <div key={project.id} ref={(el) => { desktopRefs.current[index] = el; }}>
            <ProjectHero
              project={project}
              index={index}
              onActive={() => setActiveIndex(index)}
            />
          </div>
        ))}
      </div>

      {/* Mobile: Simplified card layout */}
      <div className="lg:hidden relative z-2">
        {projects.map((project, index) => (
          <div key={project.id} ref={(el) => { mobileRefs.current[index] = el; }}>
            <MobileProjectCard project={project} index={index} onActive={() => setActiveIndex(index)} />
          </div>
        ))}
      </div>

      {/* Shared WebGL Canvas — deferred so Three.js doesn't block initial paint */}
      {mounted && (
        <ProjectsWebGL sectionRef={sectionRef as React.RefObject<HTMLElement>} />
      )}
      {/* Fade overlay for seamless auto-scroll loop */}
      <div
        ref={loopOverlayRef}
        className="fixed inset-0 bg-black pointer-events-none z-50"
        style={{ opacity: 0 }}
      />
    </section>
  );
}

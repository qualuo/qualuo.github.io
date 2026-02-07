"use client";

import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { Project, categoryThemes } from "@/lib/projects";
import { ProjectVisual } from "./ProjectVisual";
import { ProjectContent } from "./ProjectContent";

interface ProjectHeroProps {
  project: Project;
  index: number;
  totalProjects: number;
  onActive?: () => void;
  globalProgress: MotionValue<number>;
}

export function ProjectHero({
  project,
  index,
  totalProjects,
  onActive,
  globalProgress,
}: ProjectHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = categoryThemes[project.category] || categoryThemes["AI & Innovation"];

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Track when this project is active
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value) => {
      if (value > 0.3 && value < 0.7 && onActive) {
        onActive();
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, onActive]);

  // Visual transforms
  const visualOpacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0, 1, 1, 0]
  );

  const visualScale = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [1.1, 1, 1, 0.95]
  );

  // Content transforms
  const contentOpacity = useTransform(
    scrollYProgress,
    [0.15, 0.35, 0.65, 0.85],
    [0, 1, 1, 0]
  );

  const contentY = useTransform(
    scrollYProgress,
    [0.15, 0.35],
    [60, 0]
  );

  return (
    <div
      ref={containerRef}
      className="relative h-[150vh]"
    >
      {/* Sticky visual container */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Background gradient */}
        <motion.div
          className={`absolute inset-0 bg-gradient-radial ${theme.gradient}`}
          style={{ opacity: visualOpacity }}
        />

        {/* Visual */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: visualOpacity,
            scale: visualScale,
          }}
        >
          <ProjectVisual project={project} scrollProgress={scrollYProgress} />
        </motion.div>

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-r from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Project number indicator — top left, clear of right-side progress */}
        <motion.div
          className="absolute top-20 left-8 text-8xl md:text-9xl font-bold select-none pointer-events-none"
          style={{ opacity: contentOpacity, color: `${theme.primary}20` }}
        >
          {String(index + 1).padStart(2, "0")}
        </motion.div>

        {/* Content */}
        <motion.div
          className="absolute inset-0 flex items-end pointer-events-none"
          style={{
            opacity: contentOpacity,
            y: contentY,
          }}
        >
          <div className="pointer-events-auto">
            <ProjectContent project={project} theme={theme} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { motion, MotionValue, useTransform } from "framer-motion";
import { Project, categoryThemes } from "@/lib/projects";

interface ProjectProgressProps {
  projects: Project[];
  scrollProgress: MotionValue<number>;
  activeIndex: number;
  onNavigate?: (index: number) => void;
}

export function ProjectProgress({
  projects,
  scrollProgress,
  activeIndex,
  onNavigate,
}: ProjectProgressProps) {
  // Calculate overall progress bar height (desktop) / width (mobile)
  const progressSize = useTransform(scrollProgress, [0, 1], ["0%", "100%"]);

  return (
    <>
      {/* Desktop: Vertical sidebar */}
      <div className="fixed right-6 lg:right-10 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end gap-3">
        {/* Progress line */}
        <div className="absolute right-0.75 top-0 bottom-0 w-0.5 bg-white/10 rounded-full">
          <motion.div
            className="absolute top-0 left-0 w-full bg-white/50 rounded-full origin-top"
            style={{ height: progressSize }}
          />
        </div>

        {/* Project dots */}
        {projects.map((project, index) => {
          const theme = categoryThemes[project.category] || categoryThemes["AI & Innovation"];
          const isActive = activeIndex === index;

          return (
            <motion.div
              key={project.id}
              className="flex items-center gap-3 relative"
              initial={{ opacity: 0, x: 20 }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Label (shows on hover/active) */}
              <motion.span
                className="text-xs font-medium whitespace-nowrap"
                initial={{ opacity: 0, x: 10 }}
                animate={{
                  opacity: isActive ? 1 : 0,
                  x: isActive ? 0 : 10,
                }}
                transition={{ duration: 0.3 }}
                style={{ color: isActive ? theme.primary : "rgba(255,255,255,0.5)" }}
              >
                {project.title}
              </motion.span>

              {/* Dot */}
              <button
                onClick={() => onNavigate?.(index)}
                aria-label={`Navigate to ${project.title}`}
                className="cursor-pointer p-1 -m-1 group"
              >
                <motion.div
                  className="w-2 h-2 rounded-full relative z-10 group-hover:scale-150 transition-transform"
                  animate={{
                    scale: isActive ? 1.5 : 1,
                    backgroundColor: isActive ? theme.primary : "rgba(255,255,255,0.3)",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Active glow */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      style={{ backgroundColor: theme.primary }}
                    />
                  )}
                </motion.div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile: Horizontal dots at bottom */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex lg:hidden items-center gap-2">
        {/* Background pill */}
        <div className="absolute inset-0 -mx-2 -my-1.5 bg-black/40 backdrop-blur-sm rounded-full" />

        {projects.map((project, index) => {
          const theme = categoryThemes[project.category] || categoryThemes["AI & Innovation"];
          const isActive = activeIndex === index;

          return (
            <button
              key={project.id}
              onClick={() => onNavigate?.(index)}
              aria-label={`Navigate to ${project.title}`}
              className="relative z-10 cursor-pointer p-1.5 -m-1"
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.4 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="w-1.5 h-1.5 rounded-full"
                  animate={{
                    backgroundColor: isActive ? theme.primary : "rgba(255,255,255,0.25)",
                  }}
                  transition={{ duration: 0.3 }}
                />
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ backgroundColor: theme.primary }}
                  />
                )}
              </motion.div>
            </button>
          );
        })}
      </div>
    </>
  );
}

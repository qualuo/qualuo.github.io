"use client";

import { motion } from "framer-motion";
import { Project } from "@/lib/projects";

interface ProjectContentProps {
  project: Project;
  theme: {
    primary: string;
    secondary: string;
    gradient: string;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

export function ProjectContent({ project, theme }: ProjectContentProps) {
  return (
    <motion.div
      className="w-full max-w-7xl mx-auto px-6 lg:px-12 pb-16 lg:pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Category */}
      <motion.span
        className="inline-block text-sm font-medium tracking-widest uppercase mb-4"
        style={{ color: theme.primary }}
        variants={itemVariants}
      >
        {project.category}
      </motion.span>

      {/* Title */}
      <motion.h2
        className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight"
        variants={itemVariants}
      >
        {project.title}
      </motion.h2>

      {/* Description */}
      <motion.p
        className="text-lg md:text-xl text-white/70 max-w-2xl mb-8 leading-relaxed"
        variants={itemVariants}
      >
        {project.description}
      </motion.p>

      {/* Impact */}
      {project.impact && (
        <motion.p
          className="text-base md:text-lg font-medium mb-8"
          style={{ color: theme.primary }}
          variants={itemVariants}
        >
          {project.impact}
        </motion.p>
      )}

      {/* Tech stack */}
      <motion.div className="flex flex-wrap gap-3" variants={itemVariants}>
        {project.tech.map((tech) => (
          <span
            key={tech}
            className="px-4 py-2 text-sm rounded-full border border-white/20 text-white/80 backdrop-blur-sm"
            style={{
              backgroundColor: `${theme.primary}10`,
            }}
          >
            {tech}
          </span>
        ))}
      </motion.div>

      {/* Links */}
      {project.links && (
        <motion.div className="flex gap-4 mt-8 pointer-events-auto" variants={itemVariants}>
          {project.links.github && (
            <a
              href={project.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white font-medium backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                />
              </svg>
              View Code
            </a>
          )}
          {project.links.live && (
            <a
              href={project.links.live}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-full transition-colors text-white font-medium"
              style={{
                backgroundColor: theme.primary,
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View Live
            </a>
          )}
          {project.links.report && (
            <a
              href={project.links.report}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white font-medium backdrop-blur-sm"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              View Report
            </a>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

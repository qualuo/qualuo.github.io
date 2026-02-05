"use client";

import { useRef, useState } from "react";
import { motion, useScroll } from "framer-motion";
import { projects, Project, categoryThemes } from "@/lib/projects";
import { ProjectHero } from "@/components/projects/ProjectHero";
import { ProjectProgress } from "@/components/projects/ProjectProgress";

// Mobile project card component
function MobileProjectCard({ project, index }: { project: Project; index: number }) {
  const theme = categoryThemes[project.category] || categoryThemes["AI & Innovation"];

  return (
    <motion.div
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
            <img
              src={project.media.src}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `radial-gradient(ellipse at center, ${theme.primary}30, ${theme.secondary}15, transparent)`,
            }}
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black" />
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
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <motion.div
              className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="w-1 h-2 bg-white/50 rounded-full"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Desktop: Cinematic scroll experience */}
      <div className="hidden lg:block">
        {/* Progress Indicator */}
        <ProjectProgress
          projects={projects}
          scrollProgress={scrollYProgress}
          activeIndex={activeIndex}
        />

        {/* Projects */}
        {projects.map((project, index) => (
          <ProjectHero
            key={project.id}
            project={project}
            index={index}
            totalProjects={projects.length}
            onActive={() => setActiveIndex(index)}
            globalProgress={scrollYProgress}
          />
        ))}
      </div>

      {/* Mobile: Simplified card layout */}
      <div className="lg:hidden">
        {projects.map((project, index) => (
          <MobileProjectCard key={project.id} project={project} index={index} />
        ))}
      </div>
    </section>
  );
}

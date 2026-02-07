"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Experience } from "@/lib/experiences";

function createPRNG(seed = 1) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// Simple animated background for cards
function AnimatedBackground({ color, isActive }: { color: string; isActive: boolean }) {
  const particleData = useMemo(() => {
    const rand = createPRNG(33);
    return Array.from({ length: 6 }, () => ({
      x: rand() * 100 + "%",
      duration: 2 + rand() * 2,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute w-32 h-32 rounded-full blur-3xl"
        style={{ backgroundColor: color }}
        animate={{
          x: isActive ? [0, 20, -10, 0] : 0,
          y: isActive ? [0, -15, 10, 0] : 0,
          scale: isActive ? [1, 1.2, 1.1, 1] : 1,
          opacity: isActive ? 0.4 : 0.2,
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 bottom-0 w-40 h-40 rounded-full blur-3xl"
        style={{ backgroundColor: color }}
        animate={{
          x: isActive ? [0, -15, 10, 0] : 0,
          y: isActive ? [0, 10, -20, 0] : 0,
          scale: isActive ? [1, 1.1, 1.2, 1] : 1,
          opacity: isActive ? 0.3 : 0.15,
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* Floating particles */}
      {isActive && (
        <>
          {particleData.map((p, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{ backgroundColor: color }}
              initial={{
                x: p.x,
                y: "100%",
                opacity: 0
              }}
              animate={{
                y: "-10%",
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut"
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

interface BentoCardProps {
  experience: Experience;
  size: "large" | "medium" | "small";
  onClick: () => void;
}

function BentoCard({ experience, size, onClick }: BentoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    large: "col-span-2 row-span-2",
    medium: "col-span-1 row-span-2",
    small: "col-span-1 row-span-1",
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl cursor-pointer group ${sizeClasses[size]}`}
      style={{
        background: `linear-gradient(135deg, ${experience.color}15, ${experience.color}05)`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Border glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          boxShadow: `inset 0 0 0 1px ${experience.color}40, 0 0 30px ${experience.color}20`,
        }}
      />

      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent" />

      {/* Animated Background */}
      <AnimatedBackground color={experience.color} isActive={isHovered} />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        {/* Period badge */}
        <motion.span
          className="inline-block self-start px-3 py-1 rounded-full text-xs font-medium mb-3"
          style={{
            backgroundColor: `${experience.color}20`,
            color: experience.color,
          }}
          animate={{
            scale: isHovered ? 1.05 : 1,
          }}
        >
          {experience.period}
        </motion.span>

        {/* Title */}
        <motion.h3
          className="text-xl md:text-2xl font-bold text-white mb-1"
          animate={{
            y: isHovered ? -4 : 0,
          }}
        >
          {experience.title}
        </motion.h3>

        {/* Company */}
        <motion.p
          className="text-white/60 text-sm mb-3"
          animate={{
            y: isHovered ? -4 : 0,
            opacity: isHovered ? 1 : 0.6,
          }}
        >
          {experience.company}
        </motion.p>

        {/* Skills preview - only show on larger cards */}
        {size !== "small" && (
          <motion.div
            className="flex flex-wrap gap-1.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 10,
            }}
          >
            {experience.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded text-xs text-white/70 border border-white/20"
              >
                {skill}
              </span>
            ))}
          </motion.div>
        )}

        {/* Explore indicator */}
        <motion.div
          className="absolute bottom-6 right-6 flex items-center gap-2 text-white/40"
          animate={{
            opacity: isHovered ? 1 : 0,
            x: isHovered ? 0 : 10,
          }}
        >
          <span className="text-xs">Explore</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.div>
      </div>

      {/* Corner accent */}
      <div
        className="absolute top-0 right-0 w-20 h-20 opacity-20"
        style={{
          background: `radial-gradient(circle at top right, ${experience.color}, transparent 70%)`,
        }}
      />
    </motion.div>
  );
}

// Detail Modal
function DetailModal({
  experience,
  onClose,
}: {
  experience: Experience | null;
  onClose: () => void;
}) {
  if (!experience) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl"
          style={{
            background: `linear-gradient(135deg, ${experience.color}10, #000)`,
          }}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
        >
          {/* Border */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              boxShadow: `inset 0 0 0 1px ${experience.color}30`,
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col md:flex-row h-full">
            {/* Visual area */}
            <div className="relative w-full md:w-1/2 h-64 md:h-auto min-h-75">
              <AnimatedBackground color={experience.color} isActive={true} />
              <div className="absolute inset-0 bg-linear-to-r from-transparent to-black/50 md:block hidden" />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent md:hidden" />
            </div>

            {/* Content */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto">
              {/* Period */}
              <span
                className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
                style={{
                  backgroundColor: `${experience.color}20`,
                  color: experience.color,
                }}
              >
                {experience.period}
              </span>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {experience.title}
              </h2>

              {/* Company */}
              <p className="text-lg mb-6" style={{ color: experience.color }}>
                {experience.company}
              </p>

              {/* Description */}
              <p className="text-white/70 leading-relaxed mb-6">
                {experience.description}
              </p>

              {/* Highlights */}
              {experience.highlights && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-white/40 uppercase tracking-widest mb-3">
                    Key Highlights
                  </h3>
                  <ul className="space-y-2">
                    {experience.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-3 text-white/80">
                        <span
                          className="mt-2 w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: experience.color }}
                        />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills */}
              <div>
                <h3 className="text-sm font-medium text-white/40 uppercase tracking-widest mb-3">
                  Technologies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {experience.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 rounded-full text-sm border border-white/20 text-white/70"
                      style={{ backgroundColor: `${experience.color}10` }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Main Bento Lab Component
export function BentoLab({ experiences }: { experiences: Experience[] }) {
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);

  // Define card sizes based on index
  const cardSizes: ("large" | "medium" | "small")[] = ["large", "medium", "small", "small"];

  return (
    <>
      {/* Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[200px] md:auto-rows-[240px]">
        {experiences.map((exp, index) => (
          <BentoCard
            key={exp.id}
            experience={exp}
            size={cardSizes[index % cardSizes.length]}
            onClick={() => setSelectedExperience(exp)}
          />
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedExperience && (
          <DetailModal
            experience={selectedExperience}
            onClose={() => setSelectedExperience(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

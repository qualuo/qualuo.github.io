"use client";

import { motion, MotionValue, useTransform } from "framer-motion";
import { CreativeWork } from "@/lib/creativeWorks";

interface CreativeNavProps {
  works: CreativeWork[];
  scrollProgress: MotionValue<number>;
  activeIndex: number;
  onNavigate: (index: number) => void;
}

export function CreativeNav({
  works,
  scrollProgress,
  activeIndex,
  onNavigate,
}: CreativeNavProps) {
  const scaleX = useTransform(scrollProgress, [0, 1], [0, 1]);

  return (
    <>
      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-white/5">
        <motion.div
          className="h-full origin-left"
          style={{
            scaleX,
            background: `linear-gradient(90deg, ${works.map((w) => w.color).join(", ")})`,
          }}
        />
      </div>

      {/* Desktop: Vertical dot rail */}
      <nav
        className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end gap-4"
        aria-label="Section navigation"
      >
        {works.map((work, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={work.id}
              onClick={() => onNavigate(i)}
              className="group flex items-center gap-3 cursor-pointer"
              aria-label={`Go to ${work.title}`}
              aria-current={isActive ? "true" : undefined}
            >
              {/* Label */}
              <span
                className={`text-xs tracking-wide whitespace-nowrap transition-all duration-200 group-hover:opacity-50 group-hover:translate-x-0 ${isActive ? "opacity-70 translate-x-0" : "opacity-0 translate-x-2"}`}
                style={{ color: work.color }}
              >
                {work.title}
              </span>

              {/* Dot */}
              <div className="relative flex items-center justify-center">
                <motion.div
                  className="w-2 h-2 rounded-full"
                  initial={false}
                  animate={{
                    scale: isActive ? 1.3 : 1,
                    backgroundColor: isActive ? work.color : "rgba(255,255,255,0.15)",
                  }}
                  transition={{ duration: 0.3 }}
                />
                {/* Active glow ring */}
                {isActive && (
                  <motion.div
                    className="absolute w-5 h-5 rounded-full"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    style={{
                      border: `1px solid ${work.color}40`,
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Mobile: Horizontal bottom dots */}
      <nav
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex lg:hidden items-center gap-3 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm"
        aria-label="Section navigation"
      >
        {works.map((work, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={work.id}
              onClick={() => onNavigate(i)}
              className="relative flex items-center justify-center cursor-pointer"
              aria-label={`Go to ${work.title}`}
              aria-current={isActive ? "true" : undefined}
            >
              <motion.div
                className="w-2 h-2 rounded-full"
                initial={false}
                animate={{
                  scale: isActive ? 1.4 : 1,
                  backgroundColor: isActive
                    ? work.color
                    : "rgba(255,255,255,0.2)",
                }}
                transition={{ duration: 0.3 }}
              />
            </button>
          );
        })}
      </nav>
    </>
  );
}

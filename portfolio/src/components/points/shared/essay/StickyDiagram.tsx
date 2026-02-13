"use client";

import {
  motion,
  useScroll,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

export interface StickyDiagramStep {
  id: string;
  label?: string;
  content: ReactNode;
}

interface StickyDiagramProps {
  diagram: (props: {
    progress: MotionValue<number>;
    activeStep: number;
    showAll?: boolean;
  }) => ReactNode;
  steps: StickyDiagramStep[];
  /** Height per step in vh. Default 55. */
  stepHeight?: number;
  /** Flip layout — text left, diagram right. Default false (diagram left). */
  flipped?: boolean;
  className?: string;
}

export function StickyDiagram({
  diagram,
  steps,
  stepHeight = 55,
  flipped = false,
  className = "",
}: StickyDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(
      Math.floor(v * steps.length),
      steps.length - 1
    );
    setActiveStep(idx);
  });

  // Add a small buffer so the last step has room
  const totalHeight = (steps.length + 0.3) * stepHeight;

  /* ── Mobile: static layout, no scroll animation ── */
  if (isMobile) {
    return (
      <div className={`${className}`}>
        <div className="max-w-6xl mx-auto">
          {/* Diagram — static, shows all */}
          <div className="px-2 mb-8">
            <div className="w-full max-w-xl mx-auto rounded-2xl border border-white/8 bg-white/3 backdrop-blur-md overflow-hidden p-3 sm:p-4">
              {diagram({ progress: scrollYProgress, activeStep: steps.length - 1, showAll: true })}
            </div>
          </div>

          {/* All steps visible at once */}
          <div className="space-y-6 px-6">
            {steps.map((step) => (
              <div key={step.id} className="max-w-md mx-auto">
                {step.content}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Desktop: sticky scroll-driven animation ── */
  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ minHeight: `${totalHeight}vh` }}
    >
      <div
        className={`relative max-w-6xl mx-auto lg:grid lg:gap-0 lg:grid-cols-[1fr_1fr]`}
      >
        {/* Diagram column — sticky */}
        <div
          className={`${flipped ? "lg:order-2" : "lg:order-1"}`}
        >
          <div className="sticky top-[8vh] z-10 h-[70vh] flex items-center justify-center px-8">
            <motion.div
              className="w-full max-w-xl h-full rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm overflow-hidden p-6"
              key={activeStep}
              initial={{ opacity: 0.8, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              {diagram({ progress: scrollYProgress, activeStep, showAll: false })}
            </motion.div>
          </div>
        </div>

        {/* Text column */}
        <div
          className={`relative ${flipped ? "lg:order-1" : "lg:order-2"}`}
        >
          {/* Step progress track */}
          <div className="absolute left-0 top-0 bottom-0 w-px">
            <div className="sticky top-[8vh] h-[70vh] flex flex-col justify-center">
              <div className="relative h-[min(300px,60%)]">
                {/* Track line */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-white/6" />
                {/* Active segment */}
                <motion.div
                  className="absolute left-0 w-px bg-linear-to-b from-violet-400 to-fuchsia-400"
                  style={{
                    top: `${(activeStep / steps.length) * 100}%`,
                    height: `${(1 / steps.length) * 100}%`,
                  }}
                  layout
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                {/* Step dots */}
                {steps.map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute -left-0.75 w-1.75 h-1.75 rounded-full border"
                    style={{
                      top: `${((i + 0.5) / steps.length) * 100}%`,
                      transform: "translateY(-50%)",
                    }}
                    animate={{
                      backgroundColor: i === activeStep ? "rgb(167,139,250)" : "rgb(23,23,23)",
                      borderColor: i === activeStep ? "rgb(167,139,250)" : "rgba(255,255,255,0.12)",
                      scale: i === activeStep ? 1.3 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
            </div>
          </div>

          {steps.map((step, i) => {
            const isActive = i === activeStep;
            return (
              <div
                key={step.id}
                className="flex items-center justify-center px-10"
                style={{ minHeight: `${stepHeight}vh` }}
              >
                <motion.div
                  className="max-w-md"
                  animate={{
                    opacity: isActive ? 1 : 0.15,
                    y: isActive ? 0 : 6,
                    filter: isActive ? "blur(0px)" : "blur(1px)",
                  }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                >
                  {step.content}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

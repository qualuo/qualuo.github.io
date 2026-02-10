"use client";

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

// ──────────────────────────────────────────────
// Context for slide ref registration
// ──────────────────────────────────────────────

interface SlideDeckContextValue {
  registerSlide: (index: number, el: HTMLElement | null) => void;
}

const SlideDeckContext = createContext<SlideDeckContextValue | null>(null);

// ──────────────────────────────────────────────
// SlideDeck
// ──────────────────────────────────────────────

interface SlideDeckProps {
  children: ReactNode;
  slideCount: number;
  labels?: string[];
  gradient?: string;
}

export function SlideDeck({
  children,
  slideCount,
  labels,
  gradient = "from-white/60 to-white/60",
}: SlideDeckProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenToast, setShowFullscreenToast] = useState(false);

  const registerSlide = useCallback(
    (index: number, el: HTMLElement | null) => {
      slideRefs.current[index] = el;
    },
    []
  );

  // Auto-focus on mount so keyboard works immediately
  useEffect(() => {
    const timer = setTimeout(() => containerRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Track current slide via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const index = slideRefs.current.indexOf(
              entry.target as HTMLElement
            );
            if (index !== -1) setCurrentSlide(index);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );

    // Observe after a tick so refs are registered
    const timer = setTimeout(() => {
      slideRefs.current.forEach((el) => el && observer.observe(el));
    }, 50);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [slideCount]);

  // Keyboard navigation
  const navigateToSlide = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(target, slideCount - 1));
      slideRefs.current[clamped]?.scrollIntoView({ behavior: "smooth" });
    },
    [slideCount]
  );

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current
        ?.closest("[data-slide-deck-root]")
        ?.requestFullscreen();
      setIsFullscreen(true);
      setShowFullscreenToast(true);
      setTimeout(() => setShowFullscreenToast(false), 2500);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleChange = () =>
      setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
        case " ":
          e.preventDefault();
          navigateToSlide(currentSlide + 1);
          break;
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          navigateToSlide(currentSlide - 1);
          break;
        case "Home":
          e.preventDefault();
          navigateToSlide(0);
          break;
        case "End":
          e.preventDefault();
          navigateToSlide(slideCount - 1);
          break;
        case "f":
        case "F":
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, slideCount, navigateToSlide, toggleFullscreen]);

  const progressPercent =
    slideCount > 1 ? (currentSlide / (slideCount - 1)) * 100 : 0;

  return (
    <SlideDeckContext.Provider value={{ registerSlide }}>
      <div className="relative h-dvh bg-[#171717]" data-slide-deck-root>
        {/* Top progress bar */}
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
          <motion.div
            className={`h-full bg-linear-to-r ${gradient}`}
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>

        {/* Scroll-snap container */}
        <div
          ref={containerRef}
          data-slide-deck
          tabIndex={0}
          className="h-full overflow-y-auto snap-y snap-mandatory outline-none"
          style={{ scrollbarWidth: "none" }}
        >
          {children}
        </div>

        {/* Progress dots — right edge, desktop only */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col gap-2 items-end">
          {Array.from({ length: slideCount }).map((_, i) => (
            <div
              key={i}
              className="relative flex items-center"
              onMouseEnter={() => setHoveredDot(i)}
              onMouseLeave={() => setHoveredDot(null)}
            >
              {/* Label tooltip */}
              <AnimatePresence>
                {hoveredDot === i && labels?.[i] && (
                  <motion.span
                    className="absolute right-6 whitespace-nowrap text-[10px] text-slate-400 bg-white/5 backdrop-blur-md border border-white/10 rounded-md px-2 py-1"
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {labels[i]}
                  </motion.span>
                )}
              </AnimatePresence>

              <button
                onClick={() => navigateToSlide(i)}
                aria-label={`Go to slide ${i + 1}${labels?.[i] ? `: ${labels[i]}` : ""}`}
                className="group flex items-center justify-center p-1"
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    i === currentSlide
                      ? "w-2 h-2 bg-white/60"
                      : "w-1.5 h-1.5 bg-white/15 group-hover:bg-white/40"
                  }`}
                />
              </button>
            </div>
          ))}

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            aria-label={
              isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
            }
            className="mt-3 p-1.5 rounded-md bg-white/5 border border-white/8 hover:bg-white/10 transition-colors group"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-white/30 group-hover:text-white/60 transition-colors"
            >
              {isFullscreen ? (
                <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
              ) : (
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Fullscreen toast */}
        <AnimatePresence>
          {showFullscreenToast && (
            <motion.div
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-xs text-slate-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 font-mono text-[10px]">
                F
              </kbd>{" "}
              to exit fullscreen
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SlideDeckContext.Provider>
  );
}

// ──────────────────────────────────────────────
// Slide
// ──────────────────────────────────────────────

interface SlideProps {
  children: ReactNode;
  index: number;
  variant?: "default" | "hero" | "scrollable";
  className?: string;
}

export function Slide({
  children,
  index,
  variant = "default",
  className = "",
}: SlideProps) {
  const ref = useRef<HTMLDivElement>(null);
  const ctx = useContext(SlideDeckContext);

  useEffect(() => {
    ctx?.registerSlide(index, ref.current);
    return () => ctx?.registerSlide(index, null);
  }, [index, ctx]);

  if (variant === "hero") {
    return (
      <div
        ref={ref}
        className={`h-dvh snap-start flex flex-col items-center justify-center relative ${className}`}
      >
        {children}
      </div>
    );
  }

  if (variant === "scrollable") {
    return (
      <div
        ref={ref}
        className={`min-h-dvh snap-start px-6 pt-24 pb-12 ${className}`}
      >
        <div className="max-w-4xl mx-auto w-full">{children}</div>
      </div>
    );
  }

  // Default: centered content
  return (
    <div
      ref={ref}
      className={`h-dvh snap-start flex flex-col justify-center px-6 ${className}`}
    >
      <div className="max-w-4xl mx-auto w-full">{children}</div>
    </div>
  );
}

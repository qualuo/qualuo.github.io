"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useCursor } from "./CursorProvider";

const CURSOR_SIZE = {
  default: 8,
  pointer: 16,
  text: 2,
  view: 64,
  drag: 56,
  hidden: 0,
  loading: 32,
};

const OUTER_SIZE = {
  default: 32,
  pointer: 40,
  text: 0,
  view: 0,
  drag: 0,
  hidden: 0,
  loading: 0,
};

export function CustomCursor() {
  const { variant, text, isHovering } = useCursor();
  const [isVisible, setIsVisible] = useState(false);
  const isTouchDevice = useSyncExternalStore(
    () => () => {},
    () => "ontouchstart" in window || navigator.maxTouchPoints > 0,
    () => false
  );

  // Raw mouse position
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth spring animation for cursor following
  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  // Slower spring for outer ring (creates trailing effect)
  const outerSpringConfig = { damping: 20, stiffness: 200, mass: 0.8 };
  const outerX = useSpring(mouseX, outerSpringConfig);
  const outerY = useSpring(mouseY, outerSpringConfig);

  // Track mouse position
  useEffect(() => {
    if (isTouchDevice) return;

    let visible = isVisible;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!visible) {
        visible = true;
        setIsVisible(true);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [mouseX, mouseY, isVisible, isTouchDevice]);

  // Don't render on touch devices
  if (isTouchDevice) return null;

  const cursorSize = CURSOR_SIZE[variant];
  const outerSize = OUTER_SIZE[variant];
  const showText = variant === "view" || variant === "drag";
  const showBlend = variant === "default" || variant === "pointer";

  return (
    <>
      {/* Main cursor dot/circle */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-9999"
        style={{
          x: cursorX,
          y: cursorY,
        }}
      >
        <motion.div
          className="relative flex items-center justify-center"
          style={{
            marginLeft: -cursorSize / 2,
            marginTop: -cursorSize / 2,
          }}
          animate={{
            width: cursorSize,
            height: cursorSize,
            opacity: isVisible ? 1 : 0,
          }}
          transition={{
            width: { type: "spring", damping: 25, stiffness: 180 },
            height: { type: "spring", damping: 25, stiffness: 180 },
            opacity: { duration: 0.15 },
          }}
        >
          {/* Inner dot - always visible */}
          <motion.div
            className="absolute rounded-full"
            style={{
              mixBlendMode: showBlend ? "difference" : "normal",
            }}
            animate={{
              width: cursorSize,
              height: cursorSize,
              backgroundColor:
                variant === "view" || variant === "drag"
                  ? "rgba(255, 255, 255, 0.9)"
                  : variant === "loading"
                  ? "transparent"
                  : "#ffffff",
              borderWidth: variant === "loading" ? 2 : 0,
              borderColor: variant === "loading" ? "#ffffff" : "transparent",
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 180,
            }}
          />

          {/* Loading spinner */}
          {variant === "loading" && (
            <motion.div
              className="absolute w-full h-full rounded-full border-2 border-white border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}

          {/* Text label for view/drag states */}
          <AnimatePresence>
            {showText && text && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="absolute text-black text-xs font-medium tracking-wide whitespace-nowrap"
              >
                {text}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Default text for view variant without custom text */}
          <AnimatePresence>
            {variant === "view" && !text && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="absolute text-black text-xs font-medium tracking-wide"
              >
                View
              </motion.span>
            )}
          </AnimatePresence>

          {/* Drag arrows */}
          <AnimatePresence>
            {variant === "drag" && !text && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute flex items-center gap-2 text-black"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Outer ring - only for default state */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-9998"
        style={{
          x: outerX,
          y: outerY,
        }}
      >
        <motion.div
          className="rounded-full border border-white/30"
          style={{
            marginLeft: -outerSize / 2,
            marginTop: -outerSize / 2,
            mixBlendMode: "difference",
          }}
          animate={{
            width: outerSize,
            height: outerSize,
            opacity: isVisible && outerSize > 0 ? 0.4 : 0,
            scale: isHovering ? 1.1 : 1,
          }}
          transition={{
            width: { type: "spring", damping: 25, stiffness: 150 },
            height: { type: "spring", damping: 25, stiffness: 150 },
            opacity: { duration: 0.25 },
            scale: { type: "spring", damping: 20, stiffness: 150 },
          }}
        />
      </motion.div>
    </>
  );
}

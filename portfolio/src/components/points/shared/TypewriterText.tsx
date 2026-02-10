"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

interface TypewriterTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}

export function TypewriterText({
  text,
  className = "",
  speed = 30,
  delay = 300,
}: TypewriterTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!isInView || started) return;
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [isInView, started, delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;

    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, speed);

    return () => clearTimeout(timer);
  }, [started, displayed, text, speed]);

  return (
    <div ref={ref} className={className}>
      <span>{displayed}</span>
      {started && displayed.length < text.length && (
        <motion.span
          className="inline-block w-px h-[1em] bg-white/40 ml-0.5 align-text-bottom"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        />
      )}
    </div>
  );
}

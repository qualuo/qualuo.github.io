"use client";

import { useScroll, useTransform, MotionValue } from "framer-motion";
import { RefObject } from "react";

interface UseScrollDrawOptions {
  target: RefObject<HTMLElement | null>;
  offset?: ["start end", "end start"] | ["start end", "center center"];
}

export function useScrollDraw({
  target,
  offset = ["start end", "end start"],
}: UseScrollDrawOptions): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target,
    offset,
  });

  // Map the scroll range to a 0→1 pathLength
  const pathLength = useTransform(scrollYProgress, [0, 0.6], [0, 1]);

  return pathLength;
}

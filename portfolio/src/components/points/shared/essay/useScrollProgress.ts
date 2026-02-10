"use client";

import { useScroll, useTransform, type MotionValue } from "framer-motion";
import { type RefObject } from "react";

type Offset = Parameters<typeof useScroll>[0] extends { offset?: infer O } ? O : never;

interface ScrollProgressOptions {
  offset?: Offset;
}

interface ScrollProgressResult {
  progress: MotionValue<number>;
  scrollY: MotionValue<number>;
}

export function useScrollProgress(
  target: RefObject<HTMLElement | null>,
  options?: ScrollProgressOptions
): ScrollProgressResult {
  const { scrollYProgress, scrollY } = useScroll({
    target,
    offset: options?.offset ?? ["start start", "end end"],
  });

  return { progress: scrollYProgress, scrollY };
}

/** Derive a MotionValue clamped to a sub-range of a parent progress. */
export function useSubProgress(
  parentProgress: MotionValue<number>,
  range: [number, number]
): MotionValue<number> {
  return useTransform(parentProgress, range, [0, 1]);
}

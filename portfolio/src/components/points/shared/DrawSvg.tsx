"use client";

import {
  motion,
  useInView,
} from "framer-motion";
import {
  Children,
  isValidElement,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";

const MOTION_MAP: Record<string, unknown> = {
  path: motion.path,
  line: motion.line,
  circle: motion.circle,
  rect: motion.rect,
  polyline: motion.polyline,
  polygon: motion.polygon,
};

export function DrawSvg({
  children: svg,
  delay = 0,
  stagger = 0.1,
  duration = 0.6,
}: {
  children: ReactElement;
  delay?: number;
  stagger?: number;
  duration?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });

  const { children: svgChildren, ...svgProps } = svg.props as Record<string, unknown>;

  let idx = 0;
  const animated = Children.map(svgChildren as ReactNode, (child) => {
    if (!isValidElement(child)) return child;
    const tag = typeof child.type === "string" ? child.type : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Comp = tag ? (MOTION_MAP[tag] as any) : null;
    if (!Comp) return child;

    const i = idx++;
    return (
      <Comp
        {...(child.props as Record<string, unknown>)}
        key={child.key ?? i}
        pathLength="1"
        strokeDasharray="1"
        initial={{ strokeDashoffset: 1, opacity: 0 }}
        animate={
          isInView
            ? { strokeDashoffset: 0, opacity: 1 }
            : { strokeDashoffset: 1, opacity: 0 }
        }
        transition={{
          strokeDashoffset: {
            delay: delay + i * stagger,
            duration,
            ease: [0.23, 1, 0.32, 1],
          },
          opacity: { delay: delay + i * stagger, duration: 0.01 },
        }}
      />
    );
  });

  return (
    <svg ref={ref} {...svgProps}>
      {animated}
    </svg>
  );
}

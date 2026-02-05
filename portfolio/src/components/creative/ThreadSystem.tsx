"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CreativeWork, loveTheme } from "@/lib/creativeWorks";

interface ThreadSystemProps {
  works: CreativeWork[];
  hoveredId: string | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface Connection {
  from: string;
  to: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function ThreadSystem({ works, hoveredId, containerRef }: ThreadSystemProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const calculateConnections = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const newConnections: Connection[] = [];
    const processed = new Set<string>();

    setDimensions({
      width: containerRect.width,
      height: containerRect.height,
    });

    works.forEach((work) => {
      const fromCard = container.querySelector(`[data-card-id="${work.id}"]`);
      if (!fromCard) return;

      const fromRect = fromCard.getBoundingClientRect();
      const fromX = fromRect.left - containerRect.left + fromRect.width / 2;
      const fromY = fromRect.top - containerRect.top + fromRect.height / 2;

      work.connections.forEach((toId) => {
        const connectionKey = [work.id, toId].sort().join("-");
        if (processed.has(connectionKey)) return;
        processed.add(connectionKey);

        const toCard = container.querySelector(`[data-card-id="${toId}"]`);
        if (!toCard) return;

        const toRect = toCard.getBoundingClientRect();
        const toX = toRect.left - containerRect.left + toRect.width / 2;
        const toY = toRect.top - containerRect.top + toRect.height / 2;

        newConnections.push({
          from: work.id,
          to: toId,
          x1: fromX,
          y1: fromY,
          x2: toX,
          y2: toY,
        });
      });
    });

    setConnections(newConnections);
  }, [works, containerRef]);

  useEffect(() => {
    calculateConnections();

    const handleResize = () => {
      requestAnimationFrame(calculateConnections);
    };

    window.addEventListener("resize", handleResize);

    // Recalculate after initial render and animations
    const timer = setTimeout(calculateConnections, 500);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [calculateConnections]);

  const { colors } = loveTheme;

  const isConnectionActive = (conn: Connection) => {
    if (!hoveredId) return false;
    return conn.from === hoveredId || conn.to === hoveredId;
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-0"
      width={dimensions.width}
      height={dimensions.height}
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Gradient for the thread */}
        <linearGradient id="threadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.deepRose} stopOpacity="0.6" />
          <stop offset="50%" stopColor={colors.warmBlush} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colors.deepRose} stopOpacity="0.6" />
        </linearGradient>

        {/* Glow filter */}
        <filter id="threadGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Animated dash pattern */}
        <pattern
          id="threadPattern"
          patternUnits="userSpaceOnUse"
          width="20"
          height="4"
        >
          <motion.rect
            width="10"
            height="2"
            y="1"
            fill={colors.warmBlush}
            animate={{ x: [0, 20] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </pattern>
      </defs>

      {connections.map((conn) => {
        const isActive = isConnectionActive(conn);
        const midX = (conn.x1 + conn.x2) / 2;
        const midY = (conn.y1 + conn.y2) / 2;
        // Add a slight curve to the line
        const dx = conn.x2 - conn.x1;
        const dy = conn.y2 - conn.y1;
        const curvature = 0.2;
        const ctrlX = midX - dy * curvature;
        const ctrlY = midY + dx * curvature;

        return (
          <g key={`${conn.from}-${conn.to}`}>
            {/* Background glow line */}
            <motion.path
              d={`M ${conn.x1} ${conn.y1} Q ${ctrlX} ${ctrlY} ${conn.x2} ${conn.y2}`}
              fill="none"
              stroke={colors.deepRose}
              strokeWidth={isActive ? 4 : 2}
              strokeOpacity={isActive ? 0.3 : 0.1}
              filter="url(#threadGlow)"
              initial={{ pathLength: 0 }}
              animate={{
                pathLength: 1,
                strokeOpacity: isActive ? 0.4 : 0.1,
              }}
              transition={{
                pathLength: { duration: 1.5, delay: 0.5 },
                strokeOpacity: { duration: 0.3 },
              }}
            />

            {/* Main thread line */}
            <motion.path
              d={`M ${conn.x1} ${conn.y1} Q ${ctrlX} ${ctrlY} ${conn.x2} ${conn.y2}`}
              fill="none"
              stroke="url(#threadGradient)"
              strokeWidth={isActive ? 2 : 1}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: isActive ? 1 : 0.4,
              }}
              transition={{
                pathLength: { duration: 1.5, delay: 0.3 },
                opacity: { duration: 0.3 },
              }}
            />

            {/* Animated pulse along the thread when active */}
            {isActive && (
              <motion.circle
                r="3"
                fill={colors.warmBlush}
                filter="url(#threadGlow)"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  offsetDistance: ["0%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  offsetPath: `path("M ${conn.x1} ${conn.y1} Q ${ctrlX} ${ctrlY} ${conn.x2} ${conn.y2}")`,
                }}
              />
            )}

            {/* Connection point dots */}
            <motion.circle
              cx={conn.x1}
              cy={conn.y1}
              r={isActive ? 4 : 2}
              fill={colors.warmBlush}
              initial={{ scale: 0 }}
              animate={{
                scale: 1,
                opacity: isActive ? 1 : 0.5,
              }}
              transition={{ duration: 0.3, delay: 1.5 }}
            />
            <motion.circle
              cx={conn.x2}
              cy={conn.y2}
              r={isActive ? 4 : 2}
              fill={colors.warmBlush}
              initial={{ scale: 0 }}
              animate={{
                scale: 1,
                opacity: isActive ? 1 : 0.5,
              }}
              transition={{ duration: 0.3, delay: 1.5 }}
            />
          </g>
        );
      })}
    </svg>
  );
}

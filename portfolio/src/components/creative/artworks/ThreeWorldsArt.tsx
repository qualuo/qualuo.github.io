"use client";

import { motion, MotionValue, useTransform } from "framer-motion";

interface Props {
  color: string;
  scrollProgress: MotionValue<number>;
}

// Isometric cube vertices projected to 2D
function isoProject(x: number, y: number, z: number): [number, number] {
  const px = (x - z) * Math.cos(Math.PI / 6) * 25;
  const py = (x + z) * Math.sin(Math.PI / 6) * 25 - y * 25;
  return [200 + px, 220 + py];
}

function cubeFaces(cx: number, cy: number, cz: number, size: number) {
  const s = size / 2;
  // Top face
  const top = [
    isoProject(cx - s, cy + s, cz - s),
    isoProject(cx + s, cy + s, cz - s),
    isoProject(cx + s, cy + s, cz + s),
    isoProject(cx - s, cy + s, cz + s),
  ];
  // Left face
  const left = [
    isoProject(cx - s, cy + s, cz + s),
    isoProject(cx + s, cy + s, cz + s),
    isoProject(cx + s, cy - s, cz + s),
    isoProject(cx - s, cy - s, cz + s),
  ];
  // Right face
  const right = [
    isoProject(cx + s, cy + s, cz - s),
    isoProject(cx + s, cy + s, cz + s),
    isoProject(cx + s, cy - s, cz + s),
    isoProject(cx + s, cy - s, cz - s),
  ];

  return {
    top: top.map((p) => p.join(",")).join(" "),
    left: left.map((p) => p.join(",")).join(" "),
    right: right.map((p) => p.join(",")).join(" "),
  };
}

export function ThreeWorldsArt({ color, scrollProgress }: Props) {
  const rotation = useTransform(scrollProgress, [0.15, 0.85], [-8, 8]);
  const scale = useTransform(scrollProgress, [0.2, 0.5, 0.8], [0.85, 1, 0.9]);

  // Array of cubes forming an impossible/abstract structure
  const cubes = [
    { x: 0, y: 0, z: 0, s: 1.8, delay: 0 },
    { x: 2, y: 0, z: 0, s: 1.2, delay: 0.2 },
    { x: -2, y: 0, z: 0, s: 1.0, delay: 0.3 },
    { x: 0, y: 2, z: 0, s: 1.4, delay: 0.4 },
    { x: 1, y: 1, z: 1, s: 0.8, delay: 0.5 },
    { x: -1, y: 1, z: -1, s: 1.0, delay: 0.6 },
    { x: 0, y: 0, z: 2, s: 0.9, delay: 0.7 },
    { x: 0, y: 3, z: 0, s: 0.7, delay: 0.8 },
    { x: 2, y: 1, z: -1, s: 0.6, delay: 0.9 },
  ];

  return (
    <div className="w-full aspect-square relative">
      <motion.div style={{ rotate: rotation, scale }} className="w-full h-full">
        <svg viewBox="0 0 400 400" className="w-full h-full" fill="none">
          <defs>
            <radialGradient id="three-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.12" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="200" cy="200" r="185" fill="url(#three-glow)" />

          {/* Grid floor */}
          {Array.from({ length: 9 }, (_, i) => {
            const t = -4 + i;
            const [x1, y1] = isoProject(t, -1, -4);
            const [x2, y2] = isoProject(t, -1, 4);
            const [x3, y3] = isoProject(-4, -1, t);
            const [x4, y4] = isoProject(4, -1, t);
            return (
              <g key={`grid${i}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.3" opacity="0.06" />
                <line x1={x3} y1={y3} x2={x4} y2={y4} stroke={color} strokeWidth="0.3" opacity="0.06" />
              </g>
            );
          })}

          {/* Isometric cubes */}
          {cubes.map((cube, i) => {
            const faces = cubeFaces(cube.x, cube.y, cube.z, cube.s);
            return (
              <motion.g
                key={`cube${i}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -3 - (i % 3) * 2, 0],
                }}
                transition={{
                  opacity: { duration: 0.6, delay: cube.delay },
                  scale: { duration: 0.6, delay: cube.delay, type: "spring", damping: 15 },
                  y: { duration: 3 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: cube.delay },
                }}
              >
                {/* Top face — brightest */}
                <polygon points={faces.top} fill={color} opacity="0.12" stroke={color} strokeWidth="0.5" strokeOpacity="0.25" />
                {/* Left face — medium */}
                <polygon points={faces.left} fill={color} opacity="0.06" stroke={color} strokeWidth="0.5" strokeOpacity="0.2" />
                {/* Right face — darkest */}
                <polygon points={faces.right} fill={color} opacity="0.03" stroke={color} strokeWidth="0.5" strokeOpacity="0.15" />
              </motion.g>
            );
          })}

          {/* Floating wireframe octahedron hint */}
          <motion.g
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "200px 120px" }}
          >
            <polygon
              points="200,80 220,120 200,160 180,120"
              stroke={color}
              strokeWidth="0.5"
              fill="none"
              opacity="0.1"
            />
            <line x1="200" y1="80" x2="200" y2="160" stroke={color} strokeWidth="0.3" opacity="0.06" />
            <line x1="180" y1="120" x2="220" y2="120" stroke={color} strokeWidth="0.3" opacity="0.06" />
          </motion.g>
        </svg>
      </motion.div>
    </div>
  );
}

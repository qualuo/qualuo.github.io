"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

/**
 * Serpentine 2×3 grid layout matching the ~420×320 viewBox of other diagrams.
 * Row 1: Ingest → Embed → Index (left to right)
 * Row 2: Retrieve ← Re-rank ← Generate (right to left, but data flows left to right visually)
 * Actually: Row 2 continues the pipeline: Retrieve → Re-rank → Generate
 */

const STEPS = [
  { label: "Ingest", desc: "Parse & chunk" },
  { label: "Embed", desc: "Vectorize" },
  { label: "Index", desc: "Store & tag" },
  { label: "Retrieve", desc: "Semantic search" },
  { label: "Re-rank", desc: "Cross-encode" },
  { label: "Generate", desc: "LLM output" },
];

const BASE = "196,181,253";
const ACCENT = "167,139,250";

const NW = 114;
const NH = 56;
const COL_GAP = 14;
const ROW_GAP = 50;
const PAD_X = 24;
const START_Y = 48;

// Calculate positions: serpentine — row 0 L→R, row 1 R→L
function getPos(i: number) {
  const row = Math.floor(i / 3);
  const col = row === 0 ? i % 3 : 2 - (i % 3);
  return {
    x: PAD_X + col * (NW + COL_GAP),
    y: START_Y + row * (NH + ROW_GAP),
  };
}

interface RAGPipelineDiagramProps {
  progress: MotionValue<number>;
  activeStep: number;
}

function Node({
  index,
  progress,
  activeStep,
}: {
  index: number;
  progress: MotionValue<number>;
  activeStep: number;
}) {
  const step = STEPS[index];
  const { x, y } = getPos(index);
  const t = index / STEPS.length;
  const opacity = useTransform(progress, [t, t + 0.06], [index === 0 ? 1 : 0, 1]);
  const isCurrent = index === activeStep;
  const isActive = index <= activeStep;

  return (
    <motion.g style={{ opacity }}>
      {/* Glow */}
      {isCurrent && (
        <rect x={x - 4} y={y - 4} width={NW + 8} height={NH + 8} rx={16}
          fill={`rgba(${ACCENT}, 0.07)`} />
      )}
      {/* Box */}
      <rect x={x} y={y} width={NW} height={NH} rx={12}
        fill={isCurrent ? `rgba(${ACCENT}, 0.14)` : isActive ? `rgba(${ACCENT}, 0.07)` : "rgba(255,255,255,0.025)"}
        stroke={isCurrent ? `rgba(${ACCENT}, 0.55)` : isActive ? `rgba(${ACCENT}, 0.22)` : "rgba(255,255,255,0.07)"}
        strokeWidth={isCurrent ? 1.5 : 1}
      />
      {/* Number circle */}
      <circle cx={x + 20} cy={y + NH / 2} r={10}
        fill={isActive ? `rgba(${ACCENT}, 0.18)` : "rgba(255,255,255,0.04)"} />
      <text x={x + 20} y={y + NH / 2 + 4} textAnchor="middle"
        fill={isActive ? `rgba(${BASE}, 1)` : "rgba(255,255,255,0.3)"}
        fontSize={10} fontWeight={700} fontFamily="system-ui, sans-serif">
        {index + 1}
      </text>
      {/* Label */}
      <text x={x + 40} y={y + 22}
        fill={isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)"}
        fontSize={13} fontWeight={600} fontFamily="system-ui, sans-serif">
        {step.label}
      </text>
      {/* Desc */}
      <text x={x + 40} y={y + 40}
        fill={isActive ? "rgba(180,190,210,0.8)" : "rgba(148,163,184,0.35)"}
        fontSize={9} fontFamily="system-ui, sans-serif">
        {step.desc}
      </text>
    </motion.g>
  );
}

/** Animated dot that travels along an arrow path */
function FlowDot({
  x1, y1, x2, y2, delay, isActive,
}: {
  x1: number; y1: number; x2: number; y2: number; delay: number; isActive: boolean;
}) {
  if (!isActive) return null;
  return (
    <motion.circle
      r={2.5}
      fill={`rgba(${ACCENT}, 0.7)`}
      animate={{
        cx: [x1, x2],
        cy: [y1, y2],
        opacity: [0, 0.9, 0.9, 0],
      }}
      transition={{
        duration: 1.8,
        repeat: Infinity,
        delay,
        ease: "linear",
      }}
    />
  );
}

function Arrow({
  index,
  progress,
  activeStep,
}: {
  index: number;
  progress: MotionValue<number>;
  activeStep: number;
}) {
  const s = (index + 0.5) / STEPS.length;
  const e = (index + 1) / STEPS.length;
  const pathLength = useTransform(progress, [s, e], [0, 1]);
  const opacity = useTransform(progress, [s, s + 0.03], [0, 1]);
  const isActive = index < activeStep;
  const fill = isActive ? `rgba(${ACCENT}, 0.5)` : `rgba(${ACCENT}, 0.25)`;
  const stroke = isActive ? `rgba(${ACCENT}, 0.4)` : `rgba(${ACCENT}, 0.18)`;

  const from = getPos(index);
  const to = getPos(index + 1);

  // Same row — horizontal arrow
  if (Math.floor(index / 3) === Math.floor((index + 1) / 3)) {
    const goingRight = from.x < to.x;
    const y = from.y + NH / 2;
    const x1 = goingRight ? from.x + NW + 3 : from.x - 3;
    const x2 = goingRight ? to.x - 3 : to.x + NW + 3;

    return (
      <motion.g style={{ opacity }}>
        <motion.line x1={x1} y1={y} x2={x2} y2={y}
          stroke={stroke} strokeWidth={1} style={{ pathLength }} />
        {goingRight ? (
          <motion.polygon points={`${x2},${y} ${x2 - 5},${y - 3} ${x2 - 5},${y + 3}`}
            fill={fill} style={{ opacity: pathLength }} />
        ) : (
          <motion.polygon points={`${x2},${y} ${x2 + 5},${y - 3} ${x2 + 5},${y + 3}`}
            fill={fill} style={{ opacity: pathLength }} />
        )}
        {/* Flow particles */}
        <FlowDot x1={x1} y1={y} x2={x2} y2={y} delay={0} isActive={isActive} />
        <FlowDot x1={x1} y1={y} x2={x2} y2={y} delay={0.6} isActive={isActive} />
        <FlowDot x1={x1} y1={y} x2={x2} y2={y} delay={1.2} isActive={isActive} />
      </motion.g>
    );
  }

  // Cross-row (index 2 → 3): vertical arrow on right side
  const cx = from.x + NW / 2;
  const y1 = from.y + NH + 3;
  const y2 = to.y - 3;

  return (
    <motion.g style={{ opacity }}>
      <motion.line x1={cx} y1={y1} x2={cx} y2={y2}
        stroke={stroke} strokeWidth={1} style={{ pathLength }} />
      <motion.polygon points={`${cx},${y2} ${cx - 3},${y2 - 5} ${cx + 3},${y2 - 5}`}
        fill={fill} style={{ opacity: pathLength }} />
      {/* Flow particles */}
      <FlowDot x1={cx} y1={y1} x2={cx} y2={y2} delay={0} isActive={isActive} />
      <FlowDot x1={cx} y1={y1} x2={cx} y2={y2} delay={0.6} isActive={isActive} />
    </motion.g>
  );
}

export function RAGPipelineDiagram({ progress, activeStep }: RAGPipelineDiagramProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 420 240"
        className="w-full h-full max-h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible" }}
      >
        <text x={210} y={24} textAnchor="middle"
          fill={`rgba(${ACCENT}, 0.45)`} fontSize={9} fontWeight={600}
          letterSpacing={3} fontFamily="system-ui, sans-serif">
          RAG PIPELINE
        </text>

        {/* Row labels */}
        <text x={12} y={START_Y + NH / 2 + 3} fill={`rgba(${ACCENT}, 0.2)`}
          fontSize={7} fontWeight={600} fontFamily="system-ui, sans-serif"
          transform={`rotate(-90, 12, ${START_Y + NH / 2 + 3})`}>
          PREP
        </text>
        <text x={12} y={START_Y + NH + ROW_GAP + NH / 2 + 3} fill={`rgba(${ACCENT}, 0.2)`}
          fontSize={7} fontWeight={600} fontFamily="system-ui, sans-serif"
          transform={`rotate(-90, 12, ${START_Y + NH + ROW_GAP + NH / 2 + 3})`}>
          QUERY
        </text>

        {/* Arrows */}
        {STEPS.slice(0, -1).map((_, i) => (
          <Arrow key={`a-${i}`} index={i} progress={progress} activeStep={activeStep} />
        ))}

        {/* Nodes */}
        {STEPS.map((_, i) => (
          <Node key={STEPS[i].label} index={i} progress={progress} activeStep={activeStep} />
        ))}
      </svg>
    </div>
  );
}

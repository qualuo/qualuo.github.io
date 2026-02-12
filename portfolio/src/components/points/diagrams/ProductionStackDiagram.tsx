"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

const LAYERS = [
  { label: "Infrastructure", desc: "GPU compute · Serving · Caching", type: "buy" as const },
  { label: "Model Layer", desc: "Foundation models · APIs", type: "buy" as const },
  { label: "Retrieval", desc: "Vector stores · Re-ranking", type: "build" as const },
  { label: "Orchestration", desc: "Agents · Chains · Routing", type: "build" as const },
  { label: "Application", desc: "Chat · Copilots · Search", type: "build" as const },
];

const BASE = "167,139,250";
const ACCENT_BUILD = "139,92,246";
const ACCENT_BUY = "148,163,184";

const LAYER_H = 52;
const LAYER_GAP = 6;
const LAYER_W = 340;
const LEFT_X = 30;
const START_Y = 44;

interface ProductionStackDiagramProps {
  progress: MotionValue<number>;
  activeStep: number;
  /** Show all layers as active with no per-step highlighting (mobile). */
  showAll?: boolean;
}

function Layer({
  layer,
  index,
  y,
  progress,
  activeStep,
  showAll,
}: {
  layer: (typeof LAYERS)[number];
  index: number;
  y: number;
  progress: MotionValue<number>;
  activeStep: number;
  showAll?: boolean;
}) {
  const threshold = index / (LAYERS.length + 1);
  const opacity = useTransform(progress, [threshold, threshold + 0.1], [index === 0 ? 1 : 0, 1]);
  const translateY = useTransform(progress, [threshold, threshold + 0.1], [index === 0 ? 0 : 16, 0]);
  const isCurrent = showAll ? false : index === activeStep;
  const isActive = showAll ? true : index <= activeStep;
  const isBuild = layer.type === "build";

  return (
    <motion.g style={{ opacity, y: translateY }}>
      {/* Glow for current layer */}
      {isCurrent && (
        <rect
          x={LEFT_X - 4}
          y={y - 4}
          width={LAYER_W + 8}
          height={LAYER_H + 8}
          rx={14}
          fill={`rgba(${BASE}, 0.06)`}
        />
      )}
      {/* Layer rect */}
      <rect
        x={LEFT_X}
        y={y}
        width={LAYER_W}
        height={LAYER_H}
        rx={10}
        fill={
          isCurrent
            ? `rgba(${BASE}, 0.12)`
            : isActive
              ? `rgba(${BASE}, 0.05)`
              : "rgba(255,255,255,0.02)"
        }
        stroke={
          isCurrent
            ? `rgba(${BASE}, 0.5)`
            : isActive
              ? `rgba(${BASE}, 0.18)`
              : "rgba(255,255,255,0.06)"
        }
        strokeWidth={isCurrent ? 1.5 : 0.5}
      />
      {/* Type badge */}
      <rect
        x={LEFT_X + 12}
        y={y + 10}
        width={36}
        height={16}
        rx={4}
        fill={isBuild ? `rgba(${ACCENT_BUILD}, 0.18)` : "rgba(255,255,255,0.05)"}
      />
      <text
        x={LEFT_X + 30}
        y={y + 22}
        textAnchor="middle"
        fill={isBuild ? `rgba(${ACCENT_BUILD}, 1)` : `rgba(${ACCENT_BUY}, 0.8)`}
        fontSize={8}
        fontWeight={700}
        fontFamily="system-ui, sans-serif"
        letterSpacing={0.5}
      >
        {layer.type.toUpperCase()}
      </text>
      {/* Label */}
      <text
        x={LEFT_X + 60}
        y={y + 22}
        fill={isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)"}
        fontSize={13}
        fontWeight={600}
        fontFamily="system-ui, sans-serif"
      >
        {layer.label}
      </text>
      {/* Description */}
      <text
        x={LEFT_X + 60}
        y={y + 40}
        fill={isActive ? "rgba(180,190,210,0.8)" : "rgba(148,163,184,0.35)"}
        fontSize={10}
        fontFamily="system-ui, sans-serif"
      >
        {layer.desc}
      </text>
    </motion.g>
  );
}

export function ProductionStackDiagram({ progress, activeStep, showAll }: ProductionStackDiagramProps) {
  const reversedLayers = [...LAYERS].reverse();
  const totalSteps = LAYERS.length + 1;

  const evalThreshold = LAYERS.length / totalSteps;
  const evalOpacity = useTransform(progress, [evalThreshold, evalThreshold + 0.1], [0, 1]);
  const stackHeight = LAYERS.length * (LAYER_H + LAYER_GAP) - LAYER_GAP;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        viewBox={`0 0 420 ${stackHeight + START_Y + 30}`}
        className="w-full h-full max-h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible" }}
      >
        {/* Title */}
        <text
          x={210}
          y={24}
          textAnchor="middle"
          fill={`rgba(${BASE}, 0.45)`}
          fontSize={9}
          fontWeight={600}
          letterSpacing={3}
          fontFamily="system-ui, sans-serif"
        >
          PRODUCTION AI STACK
        </text>

        {/* Main layers (bottom-to-top visually) */}
        {reversedLayers.map((layer, visualIndex) => {
          const dataIndex = LAYERS.length - 1 - visualIndex;
          const y = START_Y + visualIndex * (LAYER_H + LAYER_GAP);
          return (
            <Layer
              key={layer.label}
              layer={layer}
              index={dataIndex}
              y={y}
              progress={progress}
              activeStep={activeStep}
              showAll={showAll}
            />
          );
        })}

        {/* Eval & Observability — cross-cutting sidebar */}
        <motion.g style={{ opacity: evalOpacity }}>
          <rect
            x={LEFT_X + LAYER_W + 12}
            y={START_Y}
            width={18}
            height={stackHeight}
            rx={9}
            fill={`rgba(${BASE}, 0.08)`}
            stroke={`rgba(${BASE}, 0.3)`}
            strokeWidth={0.5}
          />
          <text
            x={LEFT_X + LAYER_W + 21}
            y={START_Y + stackHeight / 2}
            textAnchor="middle"
            fill={`rgba(${BASE}, 0.7)`}
            fontSize={7}
            fontWeight={600}
            fontFamily="system-ui, sans-serif"
            letterSpacing={1}
            transform={`rotate(-90, ${LEFT_X + LAYER_W + 21}, ${START_Y + stackHeight / 2})`}
          >
            EVAL & OBSERVABILITY
          </text>
          {/* Dashed connection lines */}
          {reversedLayers.map((_, visualIndex) => {
            const y = START_Y + visualIndex * (LAYER_H + LAYER_GAP) + LAYER_H / 2;
            return (
              <line
                key={`eval-line-${visualIndex}`}
                x1={LEFT_X + LAYER_W}
                y1={y}
                x2={LEFT_X + LAYER_W + 12}
                y2={y}
                stroke={`rgba(${BASE}, 0.15)`}
                strokeWidth={0.5}
                strokeDasharray="2 3"
              />
            );
          })}
        </motion.g>

        {/* Build vs Buy legend */}
        <g transform={`translate(${LEFT_X}, ${START_Y + stackHeight + 14})`}>
          <rect width={8} height={8} rx={2} fill={`rgba(${ACCENT_BUILD}, 0.3)`} />
          <text x={14} y={7.5} fill="rgba(180,190,210,0.7)" fontSize={9} fontFamily="system-ui, sans-serif">
            Build
          </text>
          <rect x={56} y={0} width={8} height={8} rx={2} fill="rgba(255,255,255,0.06)" />
          <text x={70} y={7.5} fill="rgba(180,190,210,0.7)" fontSize={9} fontFamily="system-ui, sans-serif">
            Buy
          </text>
        </g>
      </svg>
    </div>
  );
}

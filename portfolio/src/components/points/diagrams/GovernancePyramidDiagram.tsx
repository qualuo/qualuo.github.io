"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

const LAYERS = [
  {
    label: "Principles",
    count: "3-5",
    desc: "Non-negotiable physics",
    color: "239,68,68",
    width: 40,
  },
  {
    label: "Guardrails",
    count: "10-20",
    desc: "Automated hard walls",
    color: "249,115,22",
    width: 58,
  },
  {
    label: "Defaults",
    count: "50-100",
    desc: "Opinionated but overridable",
    color: "96,165,250",
    width: 76,
  },
  {
    label: "Freedom",
    count: "\u221E",
    desc: "Judgment & creativity",
    color: "34,197,94",
    width: 94,
  },
] as const;

interface GovernancePyramidDiagramProps {
  progress: MotionValue<number>;
  activeStep: number;
  showAll?: boolean;
}

function LayerBar({
  layer,
  index,
  activeStep,
  showAll,
  progress,
}: {
  layer: (typeof LAYERS)[number];
  index: number;
  activeStep: number;
  showAll?: boolean;
  progress: MotionValue<number>;
}) {
  const isCurrent = !showAll && activeStep === index + 1;
  const isActive = showAll || activeStep >= index + 1;
  const threshold = index * 0.15;
  const entryOpacity = useTransform(progress, [threshold, threshold + 0.1], [0, 1]);
  const entryY = useTransform(progress, [threshold, threshold + 0.1], [12, 0]);

  return (
    <motion.div
      className="flex flex-col items-center"
      style={{ opacity: entryOpacity, y: entryY }}
    >
      <motion.div
        className="relative rounded-xl border px-4 py-3 transition-all duration-500 flex items-center gap-3"
        style={{
          width: `${layer.width}%`,
          minWidth: "180px",
          maxWidth: "100%",
          backgroundColor: isCurrent
            ? `rgba(${layer.color}, 0.12)`
            : isActive
              ? `rgba(${layer.color}, 0.05)`
              : "rgba(255,255,255,0.02)",
          borderColor: isCurrent
            ? `rgba(${layer.color}, 0.4)`
            : isActive
              ? `rgba(${layer.color}, 0.15)`
              : "rgba(255,255,255,0.06)",
          boxShadow: isCurrent
            ? `0 0 24px rgba(${layer.color}, 0.08)`
            : "none",
        }}
      >
        {/* Count badge */}
        <span
          className="shrink-0 text-xs font-bold rounded-md px-2 py-0.5 tabular-nums"
          style={{
            backgroundColor: `rgba(${layer.color}, ${isCurrent ? 0.2 : 0.08})`,
            color: `rgba(${layer.color}, ${isActive ? 1 : 0.4})`,
          }}
        >
          {layer.count}
        </span>

        <div className="min-w-0">
          <p
            className="text-sm font-semibold tracking-wide transition-colors duration-300"
            style={{ color: isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.3)" }}
          >
            {layer.label}
          </p>
          <p
            className="text-xs transition-colors duration-300 mt-0.5"
            style={{ color: isActive ? "rgba(180,190,210,0.7)" : "rgba(148,163,184,0.25)" }}
          >
            {layer.desc}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Miniature comparison shown at step 5 */
function ShapeComparison({ visible }: { visible: boolean }) {
  const barSets = [
    {
      label: "Typical org",
      heights: [8, 36, 36, 12],
    },
    {
      label: "High-performing",
      heights: [10, 16, 20, 46],
    },
  ];

  return (
    <motion.div
      className="flex items-end justify-center gap-8 mt-6"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
      transition={{ duration: 0.5 }}
    >
      {barSets.map((set) => (
        <div key={set.label} className="flex flex-col items-center gap-1.5">
          <div className="flex items-end gap-0.5 h-24">
            {set.heights.map((h, i) => (
              <motion.div
                key={`${set.label}-${LAYERS[i].label}`}
                className="w-5 rounded-sm"
                initial={false}
                animate={{
                  height: visible ? `${h}%` : "0%",
                  backgroundColor: `rgba(${LAYERS[i].color}, ${visible ? 0.5 : 0})`,
                }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">{set.label}</span>
        </div>
      ))}
    </motion.div>
  );
}

export function GovernancePyramidDiagram({
  progress,
  activeStep,
  showAll,
}: GovernancePyramidDiagramProps) {
  const titleOpacity = useTransform(progress, [0, 0.05], [0.5, 0.5]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2.5 py-4 px-2">
      <motion.p
        className="text-[10px] font-semibold tracking-[3px] uppercase mb-2"
        style={{
          opacity: titleOpacity,
          color: "rgba(249,115,22,0.45)",
        }}
      >
        Governance Stack
      </motion.p>

      {LAYERS.map((layer, i) => (
        <LayerBar
          key={layer.label}
          layer={layer}
          index={i}
          activeStep={activeStep}
          showAll={showAll}
          progress={progress}
        />
      ))}

      <ShapeComparison visible={!showAll && activeStep >= 5} />
    </div>
  );
}

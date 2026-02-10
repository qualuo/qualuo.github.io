"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

const TIERS = [
  { tier: "Frontier", desc: "Complex reasoning, agentic workflows", cost: "$$$", latency: "High", traffic: "5–10%" },
  { tier: "Workhorse", desc: "Most production tasks", cost: "$$", latency: "Med", traffic: "~60%" },
  { tier: "Speed", desc: "Real-time, high throughput", cost: "$", latency: "Low", traffic: "~25%" },
  { tier: "Specialized", desc: "Domain fine-tuned models", cost: "Varies", latency: "Varies", traffic: "~5%" },
];

const BASE = "196,181,253";
const ACCENT = "167,139,250";

interface ModelSelectionWidgetProps {
  progress: MotionValue<number>;
  activeStep: number;
}

export function ModelSelectionWidget({ progress, activeStep }: ModelSelectionWidgetProps) {
  // 6 steps: 0=intro, 1=frontier, 2=workhorse, 3=speed, 4=specialized, 5=router
  const routerOpacity = useTransform(progress, [0.82, 0.92], [0, 1]);
  const CARD_H = 52;
  const CARD_GAP = 8;
  const CARD_W = 310;
  const LEFT = 58;
  const TOP = 44;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        viewBox={`0 0 420 ${TOP + TIERS.length * (CARD_H + CARD_GAP) + 10}`}
        className="w-full h-full max-h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible" }}
      >
        <text x={210} y={24} textAnchor="middle"
          fill={`rgba(${ACCENT}, 0.45)`} fontSize={9} fontWeight={600}
          letterSpacing={3} fontFamily="system-ui, sans-serif">
          MODEL TIERS
        </text>

        {TIERS.map((tier, i) => {
          const y = TOP + i * (CARD_H + CARD_GAP);

          // Step 0: all dimmed. Steps 1-4: one tier per step. Step 5: all + router.
          const isHighlighted =
            activeStep === 0
              ? false
              : activeStep >= 1 && activeStep <= 4
                ? i === activeStep - 1
                : true; // step 5

          const isCurrent = activeStep >= 1 && activeStep <= 4 && i === activeStep - 1;

          return (
            <motion.g
              key={tier.tier}
              animate={{
                opacity: isHighlighted || activeStep === 0 ? 1 : 0.15,
              }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              {isCurrent && (
                <rect x={LEFT - 4} y={y - 4} width={CARD_W + 8} height={CARD_H + 8}
                  rx={14} fill={`rgba(${ACCENT}, 0.06)`} />
              )}
              <rect x={LEFT} y={y} width={CARD_W} height={CARD_H} rx={12}
                fill={isCurrent ? `rgba(${ACCENT}, 0.14)` : isHighlighted ? `rgba(${ACCENT}, 0.06)` : "rgba(255,255,255,0.02)"}
                stroke={isCurrent ? `rgba(${ACCENT}, 0.55)` : isHighlighted ? `rgba(${ACCENT}, 0.22)` : "rgba(255,255,255,0.06)"}
                strokeWidth={isCurrent ? 1.5 : 0.5}
              />
              <text x={LEFT + 16} y={y + 21}
                fill={isHighlighted ? `rgba(${BASE}, 1)` : "rgba(180,190,210,0.4)"}
                fontSize={14} fontWeight={700} fontFamily="system-ui, sans-serif">
                {tier.tier}
              </text>
              <text x={LEFT + 16} y={y + 40}
                fill={isHighlighted ? "rgba(180,190,210,0.8)" : "rgba(148,163,184,0.25)"}
                fontSize={9} fontFamily="system-ui, sans-serif">
                {tier.desc}
              </text>
              <text x={LEFT + CARD_W - 14} y={y + 21} textAnchor="end"
                fill={isHighlighted ? `rgba(${BASE}, 1)` : "rgba(100,116,139,0.3)"}
                fontSize={13} fontWeight={600} fontFamily="system-ui, sans-serif">
                {tier.traffic}
              </text>
              <text x={LEFT + CARD_W - 14} y={y + 40} textAnchor="end"
                fill="rgba(148,163,184,0.5)" fontSize={9} fontFamily="system-ui, sans-serif">
                {tier.cost} · {tier.latency}
              </text>
            </motion.g>
          );
        })}

        {/* Router sidebar (step 5) */}
        <motion.g style={{ opacity: routerOpacity }}>
          <rect
            x={LEFT - 34}
            y={TOP + 8}
            width={18}
            height={TIERS.length * (CARD_H + CARD_GAP) - CARD_GAP - 16}
            rx={9}
            fill={`rgba(${ACCENT}, 0.08)`} stroke={`rgba(${ACCENT}, 0.3)`} strokeWidth={0.5}
          />
          <text
            x={LEFT - 25}
            y={TOP + (TIERS.length * (CARD_H + CARD_GAP)) / 2 - 5}
            textAnchor="middle"
            fill={`rgba(${ACCENT}, 0.65)`} fontSize={7} fontWeight={700}
            fontFamily="system-ui, sans-serif" letterSpacing={1}
            transform={`rotate(-90, ${LEFT - 25}, ${TOP + (TIERS.length * (CARD_H + CARD_GAP)) / 2 - 5})`}>
            ROUTER
          </text>
          {TIERS.map((_, i) => (
            <line key={`r-${i}`}
              x1={LEFT - 16} y1={TOP + i * (CARD_H + CARD_GAP) + CARD_H / 2}
              x2={LEFT} y2={TOP + i * (CARD_H + CARD_GAP) + CARD_H / 2}
              stroke={`rgba(${ACCENT}, 0.2)`} strokeWidth={0.75} strokeDasharray="2 3" />
          ))}
        </motion.g>
      </svg>
    </div>
  );
}

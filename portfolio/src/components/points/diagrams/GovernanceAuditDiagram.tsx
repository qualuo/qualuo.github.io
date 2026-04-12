"use client";

import { motion, AnimatePresence } from "framer-motion";

interface GovernanceAuditDiagramProps {
  progress: import("framer-motion").MotionValue<number>;
  activeStep: number;
  showAll?: boolean;
}

const TRANSITION = {
  initial: { opacity: 0, scale: 0.95, filter: "blur(4px)" } as const,
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" } as const,
  exit: { opacity: 0, scale: 0.95, filter: "blur(4px)" } as const,
  transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const },
};

const LAYER_COLORS = [
  "239,68,68",   // Principles — red
  "249,115,22",  // Guardrails — orange
  "96,165,250",  // Defaults — blue
  "34,197,94",   // Freedom — green
];

const LAYER_LABELS = ["P", "G", "D", "F"];

/** Step 0: Trust builds, governance migrates down the stack */
function TrustCycle() {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <p className="text-[10px] font-semibold tracking-[3px] text-amber-500/40 uppercase">
        Earning Trust
      </p>

      <div className="flex items-center gap-2 justify-center">
        {LAYER_LABELS.map((label, i) => (
          <div
            key={label}
            className="w-14 h-14 rounded-lg flex items-center justify-center text-xs font-bold border"
            style={{
              backgroundColor: `rgba(${LAYER_COLORS[i]}, 0.08)`,
              borderColor: `rgba(${LAYER_COLORS[i]}, 0.25)`,
              color: `rgba(${LAYER_COLORS[i]}, 0.9)`,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Animated migration arrows pointing right/down */}
      <div className="flex items-center gap-1 text-emerald-500/60">
        {[0, 1, 2].map((i) => (
          <motion.svg
            key={i}
            width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </motion.svg>
        ))}
      </div>

      <p className="text-xs text-slate-500 text-center max-w-65">
        As trust grows, guardrails become defaults, defaults become freedom
      </p>

      {/* Trust meter */}
      <div className="w-48 h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-emerald-500/60 to-emerald-400/80"
          animate={{ width: ["10%", "85%", "10%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

/** Step 1: Incident tightens governance upward */
function IncidentResponse() {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <p className="text-[10px] font-semibold tracking-[3px] text-red-500/40 uppercase">
        Incident Response
      </p>

      <div className="flex items-center gap-2 justify-center">
        {LAYER_LABELS.map((label, i) => (
          <div
            key={label}
            className="w-14 h-14 rounded-lg flex items-center justify-center text-xs font-bold border"
            style={{
              backgroundColor: `rgba(${LAYER_COLORS[i]}, 0.08)`,
              borderColor: `rgba(${LAYER_COLORS[i]}, 0.25)`,
              color: `rgba(${LAYER_COLORS[i]}, 0.9)`,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Arrows pointing left/up */}
      <div className="flex items-center gap-1 text-red-500/60">
        {[0, 1, 2].map((i) => (
          <motion.svg
            key={i}
            width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            className="rotate-180"
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }}
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </motion.svg>
        ))}
      </div>

      <p className="text-xs text-slate-500 text-center max-w-65">
        When things break, freedom tightens into defaults, defaults into guardrails
      </p>

      <div className="w-48 h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-red-500/60 to-orange-400/80"
          animate={{ width: ["10%", "90%", "10%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

/** Stacked bar column for the timeline views */
function StackedBar({
  label,
  segments,
  delay,
}: {
  label: string;
  segments: number[]; // heights as percentages [P, G, D, F]
  delay: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex flex-col-reverse items-center gap-px h-32 w-10">
        {segments.map((h, i) => (
          <motion.div
            key={LAYER_LABELS[i]}
            className="w-full rounded-sm"
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.7, delay: delay + i * 0.08, ease: [0.23, 1, 0.32, 1] }}
            style={{ backgroundColor: `rgba(${LAYER_COLORS[i]}, 0.55)` }}
          />
        ))}
      </div>
      <span className="text-[10px] text-slate-500 font-medium">{label}</span>
    </div>
  );
}

/** Step 2: The ratchet — freedom shrinks over time */
function RatchetTrap() {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <p className="text-[10px] font-semibold tracking-[3px] text-red-500/40 uppercase">
        Governance Ratchet
      </p>

      <div className="flex items-end justify-center gap-6">
        <StackedBar label="Year 1" segments={[8, 16, 24, 52]} delay={0} />
        <StackedBar label="Year 3" segments={[8, 32, 36, 24]} delay={0.2} />
        <StackedBar label="Year 5" segments={[8, 44, 38, 10]} delay={0.4} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
        {LAYER_LABELS.map((l, i) => (
          <div key={l} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: `rgba(${LAYER_COLORS[i]}, 0.6)` }}
            />
            <span className="text-[9px] text-slate-500">
              {["Principles", "Guardrails", "Defaults", "Freedom"][i]}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 text-center max-w-60">
        Each rule addition is sensible. The trend is catastrophic.
      </p>
    </div>
  );
}

/** Step 3: Healthy equilibrium — proportions stay balanced */
function HealthyEquilibrium() {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <p className="text-[10px] font-semibold tracking-[3px] text-emerald-500/40 uppercase">
        Intentional Governance
      </p>

      <div className="flex items-end justify-center gap-6">
        <StackedBar label="Year 1" segments={[8, 16, 24, 52]} delay={0} />
        <div className="flex flex-col items-center">
          <motion.div
            className="text-emerald-500/50 mb-1"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </motion.div>
          <StackedBar label="Year 3" segments={[8, 20, 28, 44]} delay={0.2} />
        </div>
        <div className="flex flex-col items-center">
          <motion.div
            className="text-emerald-500/50 mb-1"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </motion.div>
          <StackedBar label="Year 5" segments={[8, 16, 24, 52]} delay={0.4} />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
        {LAYER_LABELS.map((l, i) => (
          <div key={l} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: `rgba(${LAYER_COLORS[i]}, 0.6)` }}
            />
            <span className="text-[9px] text-slate-500">
              {["Principles", "Guardrails", "Defaults", "Freedom"][i]}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 text-center max-w-65">
        Quarterly governance reviews migrate concerns back down the stack
      </p>
    </div>
  );
}

export function GovernanceAuditDiagram({
  activeStep,
  showAll,
}: GovernanceAuditDiagramProps) {
  if (showAll) {
    return (
      <div className="w-full flex flex-col gap-10 py-4">
        <TrustCycle />
        <IncidentResponse />
        <RatchetTrap />
        <HealthyEquilibrium />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center py-4 px-2">
      <AnimatePresence mode="wait">
        {activeStep === 0 && (
          <motion.div key="trust" {...TRANSITION}><TrustCycle /></motion.div>
        )}
        {activeStep === 1 && (
          <motion.div key="incident" {...TRANSITION}><IncidentResponse /></motion.div>
        )}
        {activeStep === 2 && (
          <motion.div key="ratchet" {...TRANSITION}><RatchetTrap /></motion.div>
        )}
        {activeStep === 3 && (
          <motion.div key="healthy" {...TRANSITION}><HealthyEquilibrium /></motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

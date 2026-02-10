"use client";

import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { SlideDeck, Slide } from "./shared/SlideDeck";
import { PresentationSection } from "./shared/PresentationSection";
import { DiagramCard } from "./shared/DiagramCard";
import { InsightCallout } from "./shared/InsightCallout";
import { TypewriterText } from "./shared/TypewriterText";
import { MagneticButton } from "@/components/animations/MagneticButton";

// ──────────────────────────────────────────────
// Data
// ──────────────────────────────────────────────

const preliminary = {
  letter: "P", label: "Preliminary", desc: "Establish the architecture capability and tailor the framework", color: "#A855F7",
};

const cyclePhases = [
  { letter: "A", label: "Architecture Vision", desc: "Set scope, constraints, and stakeholder expectations", angle: 0, color: "#8B5CF6" },
  { letter: "B", label: "Business Architecture", desc: "Define how the enterprise operates to meet its goals", angle: 45, color: "#7C3AED" },
  { letter: "C", label: "Information Systems", desc: "Design the target data and application architectures", angle: 90, color: "#6D28D9" },
  { letter: "D", label: "Technology Architecture", desc: "Map the infrastructure needed to support applications", angle: 135, color: "#5B21B6" },
  { letter: "E", label: "Opportunities & Solutions", desc: "Identify work packages and transition architectures", angle: 180, color: "#6366F1" },
  { letter: "F", label: "Migration Planning", desc: "Finalize the roadmap from baseline to target state", angle: 225, color: "#4F46E5" },
  { letter: "G", label: "Implementation Governance", desc: "Oversee delivery and ensure architecture compliance", angle: 270, color: "#4338CA" },
  { letter: "H", label: "Change Management", desc: "Monitor changes and determine if a new cycle is needed", angle: 315, color: "#3730A3" },
];

const timelineSteps = [
  {
    phase: "P", label: "Preliminary", duration: "Weeks 1–4", color: "#A855F7", isSetup: true,
    activity: "Stand up the architecture team, adopt and tailor TOGAF, define Architecture Principles.",
    deliverables: ["Organizational Model for EA", "Tailored Architecture Framework", "Architecture Principles catalog", "Architecture tool selection"],
    example: "A retail company forms a 5-person EA team, selects Sparx EA as their modeling tool, and publishes 12 Architecture Principles.",
  },
  {
    phase: "A", label: "Architecture Vision", duration: "Weeks 5–8", color: "#8B5CF6",
    activity: "Capture stakeholder concerns, define scope, produce an approved Architecture Vision and Statement of Architecture Work.",
    deliverables: ["Stakeholder Map and Concern Matrix", "Architecture Vision document", "Statement of Architecture Work (signed off)", "High-level baseline and target descriptions"],
    example: "Stakeholder interviews reveal the CTO wants cloud-native, finance wants cost transparency, and operations wants 99.95% uptime — the Vision reconciles these.",
  },
  {
    phase: "B", label: "Business Architecture", duration: "Weeks 9–14", color: "#7C3AED",
    activity: "Model baseline and target business processes, organization structures, and capabilities. Perform gap analysis.",
    deliverables: ["Business Capability Map (L0–L2)", "Target operating model", "Gap analysis: current vs. target", "Business Architecture Definition Document"],
    example: "The capability map exposes 3 redundant order-fulfillment processes across regions — the target architecture consolidates them into one global process.",
  },
  {
    phase: "C", label: "Information Systems", duration: "Weeks 15–22", color: "#6D28D9",
    activity: "Design target data and application architectures, ensuring they enable the business architecture.",
    deliverables: ["Application Portfolio catalog with disposition", "Conceptual Data Model and data-flow diagrams", "Application interaction matrix", "Data Architecture Definition Document"],
    example: "Portfolio analysis reveals 47 applications — 12 flagged for retirement, 8 for consolidation, saving ~$2M/year in licensing.",
  },
  {
    phase: "D", label: "Technology Architecture", duration: "Weeks 23–28", color: "#5B21B6",
    activity: "Map the infrastructure, platforms, middleware, and networks needed to support target services.",
    deliverables: ["Technology Standards catalog", "Platform Architecture blueprint", "Environment and Location Diagram", "Technology Architecture Definition Document"],
    example: "The team selects Kubernetes on AWS as the target container platform and defines a standard CI/CD pipeline for all delivery teams.",
  },
  {
    phase: "E", label: "Opportunities & Solutions", duration: "Weeks 29–32", color: "#6366F1",
    activity: "Evaluate build-vs-buy, define work packages, and group them into transition architectures.",
    deliverables: ["Work package list with effort estimates", "Transition Architecture definitions", "Build vs. Buy analysis per component", "Risk assessment per work package"],
    example: "Three transition architectures are defined: T1 migrates the data layer (6 months), T2 replaces the legacy order system (9 months), T3 decommissions the old data center.",
  },
  {
    phase: "F", label: "Migration Planning", duration: "Weeks 33–36", color: "#4F46E5",
    activity: "Prioritize projects, sequence the transitions, finalize the implementation roadmap with cost/benefit analysis.",
    deliverables: ["Prioritized project portfolio", "Implementation and Migration Plan", "Cost-benefit analysis per transition", "Resource and dependency matrix"],
    example: "Cost-benefit analysis shows T1 (data migration) delivers the highest ROI at lowest risk — it's sequenced first, funding approved, teams assigned.",
  },
  {
    phase: "G", label: "Implementation Governance", duration: "Weeks 37–52+", color: "#4338CA",
    activity: "Oversee delivery, run architecture compliance reviews, issue Architecture Contracts, and handle dispensations.",
    deliverables: ["Architecture Contracts (signed)", "Compliance assessment reports", "Change requests and dispensation log", "Updated Architecture Repository"],
    example: "Bi-weekly compliance reviews catch a team deviating from the API-first standard — a dispensation is granted for the MVP with a remediation plan.",
  },
  {
    phase: "H", label: "Change Management", duration: "Ongoing", color: "#3730A3",
    activity: "Monitor technology and business changes, capture lessons learned, assess fitness-for-purpose, and trigger the next ADM cycle when needed.",
    deliverables: ["Architecture change requests log", "Lessons learned register", "Technology Radar updates", "Trigger for next ADM cycle"],
    example: "Six months post-implementation, a competitor's acquisition changes the market. The Change Management board triggers a new ADM cycle.",
  },
];

const SLIDE_LABELS = ["", "Overview", "The Case", "ADM Cycle", "In Practice", "TOGAF + Agile", "Takeaway"];

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function ADMWheel() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [activePhase, setActivePhase] = useState<number | null>(null);

  const activeData = activePhase === -1
    ? preliminary
    : activePhase !== null ? cyclePhases[activePhase] : null;

  return (
    <div className="relative">
      {/* ── Desktop: Preliminary above, A-H wheel below ── */}
      <div ref={ref} className="hidden md:block">
        {/* Preliminary — entry point above the wheel */}
        <div className="flex flex-col items-center mb-2">
          <MagneticButton strength={0.15}>
            <motion.div
              className="px-3 py-2 rounded-xl bg-white/4 border backdrop-blur-sm text-center cursor-default transition-all duration-300"
              style={{
                borderColor: activePhase === -1 ? `${preliminary.color}60` : `${preliminary.color}25`,
                backgroundColor: activePhase === -1 ? `${preliminary.color}15` : undefined,
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              onMouseEnter={() => setActivePhase(-1)}
              onMouseLeave={() => setActivePhase(null)}
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-[10px] font-bold block mb-0.5" style={{ color: preliminary.color }}>
                {preliminary.letter}
              </span>
              <span className="text-[9px] text-slate-400 font-medium">
                {preliminary.label}
              </span>
            </motion.div>
          </MagneticButton>
          <motion.svg
            width="10" height="16" viewBox="0 0 12 20" className="text-white/15 my-0.5"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
          >
            <path d="M6 0v16M3 13l3 4 3-4" stroke="currentColor" strokeWidth="1" fill="none" />
          </motion.svg>
        </div>

        {/* The A-H cycle wheel */}
        <div className="relative w-full max-w-lg mx-auto aspect-square">
          <motion.div
            className="absolute inset-4 rounded-full border border-white/5"
            initial={{ scale: 0, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          />

          {/* SVG: cycle arcs + spoke lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <path d="M0,0 L6,2 L0,4" fill="white" fillOpacity="0.2" />
              </marker>
            </defs>

            {cyclePhases.map((_phase, i) => {
              const next = (i + 1) % cyclePhases.length;
              const r = 28;
              const a1 = (cyclePhases[i].angle - 90 + 10) * (Math.PI / 180);
              const a2 = (cyclePhases[next].angle - 90 - 10) * (Math.PI / 180);
              const x1 = 50 + r * Math.cos(a1);
              const y1 = 50 + r * Math.sin(a1);
              const x2 = 50 + r * Math.cos(a2);
              const y2 = 50 + r * Math.sin(a2);
              return (
                <motion.path
                  key={`arc-${i}`}
                  d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                  fill="none"
                  stroke="white"
                  strokeOpacity="0.08"
                  strokeWidth="0.4"
                  markerEnd="url(#arrowhead)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
                  transition={{ delay: 0.6 + i * 0.06, duration: 0.4 }}
                />
              );
            })}

            {cyclePhases.map((phase, i) => {
              const rad = (phase.angle - 90) * (Math.PI / 180);
              const x = 50 + 38 * Math.cos(rad);
              const y = 50 + 38 * Math.sin(rad);
              return (
                <motion.line
                  key={i}
                  x1="50" y1="50" x2={x} y2={y}
                  stroke={phase.color}
                  strokeOpacity={activePhase === i ? 0.4 : 0.08}
                  strokeWidth="0.3"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.5 }}
                />
              );
            })}
          </svg>

          {/* Center circle — Requirements Management */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-white/3 border border-purple-500/20 flex items-center justify-center text-center backdrop-blur-sm"
            initial={{ scale: 0, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className="text-[11px] text-purple-300/80 font-medium leading-tight px-2">
              Requirements<br />Management
            </span>
          </motion.div>

          {/* Cycle phase nodes A-H */}
          {cyclePhases.map((phase, i) => {
            const rad = (phase.angle - 90) * (Math.PI / 180);
            const x = 50 + 38 * Math.cos(rad);
            const y = 50 + 38 * Math.sin(rad);

            return (
              <motion.div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                onMouseEnter={() => setActivePhase(i)}
                onMouseLeave={() => setActivePhase(null)}
              >
                <MagneticButton strength={0.2}>
                  <motion.div
                    className="px-3 py-2.5 rounded-xl bg-white/4 border backdrop-blur-sm text-center cursor-default transition-all duration-300 min-w-22"
                    style={{
                      borderColor: activePhase === i ? `${phase.color}60` : `${phase.color}20`,
                      backgroundColor: activePhase === i ? `${phase.color}15` : undefined,
                    }}
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-[10px] font-bold block mb-0.5" style={{ color: phase.color }}>
                      {phase.letter}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium leading-tight block">
                      {phase.label}
                    </span>
                  </motion.div>
                </MagneticButton>
              </motion.div>
            );
          })}
        </div>

        {/* Hover tooltip */}
        <div className="h-7 mt-3 text-center">
          {activeData && (
            <motion.p
              className="text-xs text-slate-400"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="font-medium text-slate-300">{activeData.label}</span>
              {" — "}
              {activeData.desc}
            </motion.p>
          )}
        </div>
      </div>

      {/* ── Mobile: Preliminary then A-H list ── */}
      <div className="md:hidden space-y-2">
        <motion.div
          className="p-3 rounded-xl bg-white/3 border border-purple-500/20 text-center backdrop-blur-sm mb-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xs text-purple-300 font-medium">Requirements Management</span>
          <p className="text-[11px] text-slate-500 mt-1">Continuous process across all phases</p>
        </motion.div>

        {/* Preliminary */}
        <motion.div
          className="flex items-center gap-3 p-3 rounded-xl border"
          style={{ backgroundColor: `${preliminary.color}08`, borderColor: `${preliminary.color}20` }}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: `${preliminary.color}20`, color: preliminary.color }}
          >
            {preliminary.letter}
          </div>
          <div className="flex-1">
            <span className="text-sm text-slate-300">{preliminary.label}</span>
            <span className="text-[10px] text-slate-600 ml-2">One-time setup</span>
          </div>
        </motion.div>

        <div className="flex justify-center py-0.5">
          <svg width="12" height="10" viewBox="0 0 12 10" className="text-white/15">
            <path d="M6 0v7M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Iterative cycle A-H */}
        <div className="border border-white/5 rounded-2xl p-3 space-y-1.5">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest text-center mb-1">Iterative Cycle</p>

          {cyclePhases.map((phase, i) => (
            <div key={i}>
              {i > 0 && (
                <div className="flex justify-center -mt-0.5 -mb-0.5 py-0.5">
                  <svg width="8" height="8" viewBox="0 0 12 10" className="text-white/10">
                    <path d="M6 0v7M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1" fill="none" />
                  </svg>
                </div>
              )}
              <motion.div
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white/3 border"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: `${phase.color}20`, color: phase.color }}
                >
                  {phase.letter}
                </div>
                <div className="min-w-0">
                  <span className="text-sm text-slate-300">{phase.label}</span>
                  <p className="text-[10px] text-slate-500 leading-tight">{phase.desc}</p>
                </div>
              </motion.div>
            </div>
          ))}

          <motion.div
            className="flex items-center justify-center gap-2 pt-1 text-slate-600"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 12a9 9 0 1 1 9 9M3 12l3-3m-3 3l3 3" />
            </svg>
            <span className="text-[10px] uppercase tracking-widest">Repeats back to Phase A</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function CompactTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  // Scroll-draw timeline line
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 0.7], ["0%", "100%"]);

  return (
    <div ref={containerRef}>
      <div ref={ref} className="relative">
        {/* Scroll-draw line */}
        <div className="absolute left-3.5 top-2 bottom-2 w-px hidden sm:block overflow-hidden">
          <motion.div
            className="w-full bg-linear-to-b from-purple-500/30 to-indigo-500/30"
            style={{ height: lineHeight }}
          />
        </div>

        <div className="space-y-1.5">
          {timelineSteps.map((step, i) => (
            <div key={step.phase}>
              <motion.div
                className={`flex items-center gap-3 p-2.5 rounded-xl border backdrop-blur-sm cursor-pointer transition-all duration-300 ${step.isSetup ? "border-dashed" : ""}`}
                style={{
                  borderColor: expandedStep === i ? `${step.color}40` : "rgba(255,255,255,0.06)",
                  backgroundColor: expandedStep === i ? `${step.color}08` : "rgba(255,255,255,0.02)",
                }}
                initial={{ opacity: 0, x: -15 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.04, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                onClick={() => setExpandedStep(expandedStep === i ? null : i)}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 border relative z-10"
                  style={{ backgroundColor: `${step.color}20`, borderColor: `${step.color}40`, color: step.color }}
                >
                  {step.phase}
                </div>
                <div className="flex-1 min-w-0 flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-white">{step.label}</span>
                  <span className="text-[10px] text-slate-600 hidden sm:inline">{step.duration}</span>
                  {step.isSetup && (
                    <span className="text-[9px] text-purple-400/70 uppercase tracking-widest hidden sm:inline">One-time</span>
                  )}
                </div>
                <svg
                  className={`w-3 h-3 text-slate-600 transition-transform shrink-0 ${expandedStep === i ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>

              <AnimatePresence>
                {expandedStep === i && (
                  <motion.div
                    className="ml-10 mr-2 px-4 py-3 space-y-3 border-l"
                    style={{ borderColor: `${step.color}20` }}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <p className="text-xs text-slate-400 leading-relaxed">{step.activity}</p>

                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-1.5">Key Deliverables</p>
                      <div className="flex flex-wrap gap-1.5">
                        {step.deliverables.map((d) => (
                          <span
                            key={d}
                            className="text-[10px] px-2 py-0.5 rounded-md border leading-relaxed"
                            style={{ borderColor: `${step.color}20`, color: `${step.color}CC`, backgroundColor: `${step.color}08` }}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg bg-white/2 border border-white/5 px-3 py-2">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-1">Example</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed italic">{step.example}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mt-3 text-slate-600">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 12a9 9 0 1 1 9 9M3 12l3-3m-3 3l3 3" />
          </svg>
          <span className="text-[10px] uppercase tracking-widest">Next cycle begins — Phase A revisited with lessons learned</span>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Presentation
// ──────────────────────────────────────────────

export function TogafPresentation() {
  return (
    <SlideDeck slideCount={7} labels={SLIDE_LABELS} gradient="from-purple-400/60 via-indigo-400/60 to-blue-400/60">
      {/* Grain texture overlay */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-10 opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain-togaf">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-togaf)" />
      </svg>

      {/* ═══════ Slide 0: HERO ═══════ */}
      <Slide index={0} variant="hero">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-center"
        >
          <motion.p
            className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Enterprise Architecture Framework
          </motion.p>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-4">
            <span className="bg-linear-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              TOGAF
            </span>
          </h1>

          <motion.p
            className="text-slate-500 text-lg md:text-xl tracking-wide max-w-lg mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            The Open Group Architecture Framework
          </motion.p>
        </motion.div>

        <motion.div
          className="absolute bottom-12 flex flex-col items-center gap-2 text-slate-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </Slide>

      {/* ═══════ Slide 1: Overview ═══════ */}
      <Slide index={1}>
        <PresentationSection eyebrow="Overview" title="What is TOGAF?">
          <p className="text-xl text-slate-300 leading-relaxed font-light">
            TOGAF is the world&apos;s most widely adopted framework for enterprise
            architecture. It provides a systematic approach for designing, planning,
            implementing, and governing enterprise information architecture.
          </p>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 2: Why TOGAF ═══════ */}
      <Slide index={2}>
        <PresentationSection eyebrow="The Case" title="Why TOGAF?">
          <p className="text-slate-400 leading-relaxed mb-8">
            Without a shared architecture framework, enterprises accumulate
            redundant systems, misaligned investments, and brittle integrations.
            TOGAF provides the common language and process to fix that.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { title: "Reduce Duplication", desc: "Identify overlapping capabilities and consolidate systems, cutting licensing and maintenance costs." },
              { title: "Align IT to Strategy", desc: "Every technology decision traces back to a business objective — no orphaned projects." },
              { title: "Accelerate Delivery", desc: "Reusable building blocks and standardized patterns mean teams build on proven foundations, not from scratch." },
              { title: "Manage Complexity", desc: "A structured repository of architectures makes dependencies visible and change impact predictable." },
              { title: "De-risk Transformation", desc: "Gap analysis and transition architectures replace big-bang migrations with sequenced, low-risk steps." },
              { title: "Vendor Independence", desc: "Technology-neutral architecture decisions prevent lock-in and preserve optionality." },
            ].map((item, i) => (
              <DiagramCard key={item.title} delay={i * 0.06}>
                <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </DiagramCard>
            ))}
          </div>
          <InsightCallout>
            In practice, the biggest win isn&apos;t the framework itself — it&apos;s
            giving 200 people the same vocabulary. TOGAF adoption has been observed to
            cut stakeholder alignment meetings in half.
          </InsightCallout>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 3: ADM Cycle ═══════ */}
      <Slide index={3}>
        <PresentationSection eyebrow="Core Method" title="Architecture Development Method">
          <p className="text-slate-400 leading-relaxed mb-4">
            The ADM is the heart of TOGAF — not a linear process, but an
            iterative cycle. Each revolution refines the architecture. Phases
            can be revisited, reordered, or run in parallel.
          </p>
          <ADMWheel />
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 4: Compact Timeline ═══════ */}
      <Slide index={4} variant="scrollable">
        <PresentationSection eyebrow="In Practice" title="A Complete Cycle">
          <p className="text-slate-400 leading-relaxed mb-4">
            A typical first pass through the ADM for a mid-size enterprise.
            Expand any phase to explore deliverables and real-world examples.
          </p>
          <CompactTimeline />
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 5: TOGAF + Agile ═══════ */}
      <Slide index={5}>
        <PresentationSection eyebrow="Common Question" title="TOGAF + Agile">
          <p className="text-slate-400 leading-relaxed mb-8">
            TOGAF and Agile operate at different altitudes. TOGAF sets strategic
            direction — what to build, in what order, with what constraints.
            Agile handles tactical delivery — how to build it, sprint by sprint.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <DiagramCard delay={0}>
              <p className="text-xs text-purple-400 uppercase tracking-widest mb-2 font-semibold">Architecture Runway</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                The EA team works 1–2 quarters ahead, producing lightweight
                Architecture Visions and enough of Phases B–D to define guardrails.
                Delivery teams execute within those boundaries.
              </p>
            </DiagramCard>
            <DiagramCard delay={0.06}>
              <p className="text-xs text-purple-400 uppercase tracking-widest mb-2 font-semibold">Thin ADM Cycles</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                Instead of a 52-week waterfall pass, run compressed ADM iterations
                (2–4 weeks) scoped to a single initiative. Produces &quot;just enough&quot;
                architecture.
              </p>
            </DiagramCard>
            <DiagramCard delay={0.12}>
              <p className="text-xs text-purple-400 uppercase tracking-widest mb-2 font-semibold">Architecture as Backlog</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                Transition architectures from Phase E become epics. Work packages
                become features. The architecture roadmap feeds the program backlog
                directly.
              </p>
            </DiagramCard>
            <DiagramCard delay={0.18}>
              <p className="text-xs text-purple-400 uppercase tracking-widest mb-2 font-semibold">Governance via Code</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                Phase G compliance shifts from formal gate reviews to architectural
                decision records (ADRs), automated fitness functions, and pull request
                reviews.
              </p>
            </DiagramCard>
          </div>
          <InsightCallout>
            The tension dissolves once TOGAF is treated as a thinking framework,
            not a documentation exercise. Strategic direction up front, autonomous
            delivery downstream.
          </InsightCallout>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 6: Closing — So What? ═══════ */}
      <Slide index={6}>
        <PresentationSection eyebrow="So What?" title="What to Do Differently">
          <div className="space-y-3 mb-8">
            <DiagramCard delay={0}>
              <p className="text-sm text-slate-300 leading-relaxed">
                Don&apos;t adopt TOGAF as a compliance exercise. Adopt it as a
                language — then let teams adapt the process.
              </p>
            </DiagramCard>
            <DiagramCard delay={0.08}>
              <p className="text-sm text-slate-300 leading-relaxed">
                Start with Phase B (Business Architecture). Without articulating
                what the business needs, the technology decisions downstream
                are guesswork.
              </p>
            </DiagramCard>
            <DiagramCard delay={0.16}>
              <p className="text-sm text-slate-300 leading-relaxed">
                Measure architecture success by the speed of the next change,
                not the completeness of current documentation.
              </p>
            </DiagramCard>
          </div>
          <TypewriterText
            text="Architecture is not a destination — it is a continuous practice."
            className="text-slate-600 text-sm tracking-wide italic text-center"
            speed={35}
          />
        </PresentationSection>
      </Slide>
    </SlideDeck>
  );
}

"use client";

import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { SlideDeck, Slide } from "./shared/SlideDeck";
import { PresentationSection } from "./shared/PresentationSection";
import { DiagramCard } from "./shared/DiagramCard";
import { InsightCallout } from "./shared/InsightCallout";
import { TypewriterText } from "./shared/TypewriterText";
import { DrawSvg } from "./shared/DrawSvg";

// ──────────────────────────────────────────────
// Icons (stroke-based, currentColor)
// ──────────────────────────────────────────────

const ICONS = {
  tangled: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 7c4 0 4 10 8 10s4-10 8-10" />
      <path d="M4 17c4 0 4-10 8-10s4 10 8 10" />
    </svg>
  ),
  lock: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  ),
  eyeOff: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  anchor: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" />
      <line x1="12" y1="8" x2="12" y2="21" />
      <path d="M5 12H2a10 10 0 0020 0h-3" />
    </svg>
  ),
  copy: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  ),
  zap: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  dollar: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  power: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 11-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  ),
  landmark: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
      <line x1="2" y1="18" x2="22" y2="18" />
    </svg>
  ),
  link: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  ),
  cycle: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <polyline points="23 20 23 14 17 14" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
    </svg>
  ),
  shuffle: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  ),
  target: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  clipboardList: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  ),
  scissors: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  ),
  wrench: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
};

// ──────────────────────────────────────────────
// Data
// ──────────────────────────────────────────────

const antiPatterns = [
  { title: "Spaghetti Integration", desc: "Point-to-point connections multiply with every new system. One change breaks three others.", icon: ICONS.tangled },
  { title: "Vendor Lock-in", desc: "A single vendor controls your roadmap, pricing, and deprecation timeline. You lose all leverage.", icon: ICONS.lock },
  { title: "Shadow IT", desc: "Departments buy their own tools because the official stack doesn't meet their needs. Data fragments.", icon: ICONS.eyeOff },
  { title: "Legacy Paralysis", desc: "Core systems are too risky to touch, too expensive to replace, and too critical to ignore.", icon: ICONS.anchor },
  { title: "Duplication Sprawl", desc: "Multiple tools solving the same problem across business units. Licensing costs compound silently.", icon: ICONS.copy },
  { title: "Big-Bang Migration", desc: "Multi-year transformation programs that deliver value only at the end — if they deliver at all.", icon: ICONS.zap },
];

const approaches = [
  {
    title: "Single Platform",
    subtitle: "One vendor does everything",
    color: "#EF4444",
    verdict: "Tempting but fragile",
    pros: ["Lower initial integration effort", "Single vendor relationship", "Unified UI out of the box"],
    cons: ["No vendor excels at everything", "Total lock-in on roadmap and pricing", "Modules often integrate poorly internally", "Innovation stagnation vs. best-of-breed"],
  },
  {
    title: "Best-of-Breed",
    subtitle: "Best tool per domain, integrated",
    color: "#F59E0B",
    verdict: "Powerful but demanding",
    pros: ["Strongest capability per domain", "Swap components freely", "Isolated failure blast radius"],
    cons: ["Integration is your responsibility", "Requires dedicated integration team", "More vendor relationships to manage"],
  },
  {
    title: "Composable Hybrid",
    subtitle: "Buy commodity, build your edge",
    color: "#10B981",
    verdict: "The optimal direction",
    pros: ["Best-in-class where it matters", "Controlled integration layer", "Competitive advantage preserved", "Replaceability built in"],
    cons: ["Requires architectural discipline", "Must clearly define what's commodity vs. edge"],
  },
];

const composableLayers = [
  { label: "Custom UX Layer", desc: "Unified experience across all systems — your front door", color: "#14B8A6", type: "build" as const, detail: "This is where your brand lives. A single, composable front-end that aggregates capabilities from all downstream systems. Users never see the complexity behind it." },
  { label: "Orchestration & Logic", desc: "Business rules, workflows, and event routing you own", color: "#10B981", type: "build" as const, detail: "The brain of your architecture. Event-driven workflows, approval chains, domain logic — all in code you control. This is where business agility lives or dies." },
  { label: "Integration Platform", desc: "API gateway, event bus, canonical data models", color: "#059669", type: "build" as const, detail: "The most under-invested layer in most enterprises. API gateway, event bus, canonical data models, transformation pipelines. Done right, this is what makes everything else replaceable." },
  { label: "ERP / Finance", desc: "Commodity — solved problem, don't re-solve it", color: "#0D9488", type: "buy" as const, detail: "General ledger, accounts payable, procurement — these are standardized across industries. Buy the best commodity solution, configure it minimally, integrate it cleanly." },
  { label: "HCM / Payroll", desc: "Commodity — standardized processes across industries", color: "#0891B2", type: "buy" as const, detail: "Payroll, benefits, time tracking — highly regulated, rarely a differentiator. Buy it, connect it to your identity model, and move on to what matters." },
  { label: "Your Secret Sauce", desc: "The 1–2 capabilities that define your competitive edge", color: "#14B8A6", type: "build" as const, detail: "The capabilities that make customers choose you over the competition. This is where you invest engineering talent, own the IP, and iterate weekly." },
];

const settleVsFluid = [
  { settle: "Data definitions & contracts", fluid: "Which database or system stores it" },
  { settle: "Integration patterns & standards", fluid: "Which vendor provides them" },
  { settle: "Security & identity model", fluid: "Individual security tools" },
  { settle: "Architectural principles", fluid: "Specific technologies" },
  { settle: "API contract interfaces", fluid: "Implementation behind the API" },
];

const successMetrics = [
  { metric: "Time to Replace", desc: "Can you swap a system in months, not years?", icon: ICONS.clock, color: "#14B8A6" },
  { metric: "Clarity of Ownership", desc: "Does every system have one person who decides?", icon: ICONS.user, color: "#10B981" },
  { metric: "Cost per Transaction", desc: "Do you know the true cost of each business process?", icon: ICONS.dollar, color: "#059669" },
  { metric: "Decommission Velocity", desc: "Can you turn off a system without a 2-year committee?", icon: ICONS.power, color: "#0D9488" },
];

const SLIDE_LABELS = ["", "Overview", "Anti-patterns", "Approaches", "Architecture", "Principles", "Build vs Buy", "Metrics", "Summary", ""];

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

const GRADIENT = "from-teal-400 to-emerald-400";

function ApproachComparison() {
  const [active, setActive] = useState(2);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="space-y-4">
      <div className="grid grid-cols-2 sm:flex gap-2 mb-6">
        {approaches.map((a, i) => (
          <motion.button
            key={a.title}
            className="sm:flex-1 py-2.5 px-3 rounded-xl text-xs font-medium border transition-all duration-300 cursor-pointer"
            style={{
              borderColor: active === i ? `${a.color}60` : "rgba(255,255,255,0.08)",
              backgroundColor: active === i ? `${a.color}15` : "rgba(255,255,255,0.03)",
              color: active === i ? a.color : "rgb(148,163,184)",
            }}
            onClick={() => setActive(i)}
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="block font-semibold text-sm mb-0.5" style={{ color: active === i ? a.color : "white" }}>
              {a.title}
            </span>
            <span className="block text-[10px] opacity-70">{a.subtitle}</span>
          </motion.button>
        ))}
      </div>

      <motion.div
        key={active}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 md:p-8 rounded-2xl bg-white/3 border border-white/8 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: approaches[active].color }}>
            {approaches[active].verdict}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-emerald-400/70 uppercase tracking-widest font-semibold mb-3">Strengths</p>
            <ul className="space-y-2">
              {approaches[active].pros.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-emerald-400 mt-0.5 shrink-0">+</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs text-red-400/70 uppercase tracking-widest font-semibold mb-3">Trade-offs</p>
            <ul className="space-y-2">
              {approaches[active].cons.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-red-400/70 mt-0.5 shrink-0">-</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ComposableStack() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null);

  // Scroll-draw connector
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const connectorHeight = useTransform(scrollYProgress, [0, 0.5], ["0%", "100%"]);

  return (
    <div ref={ref} className="relative">
      {/* Scroll-draw connector line */}
      <div className="absolute left-6 top-4 bottom-4 w-px hidden sm:block overflow-hidden">
        <motion.div
          className="w-full bg-linear-to-b from-teal-500/20 to-emerald-500/20"
          style={{ height: connectorHeight }}
        />
      </div>

      <div className="space-y-2">
        {composableLayers.map((layer, i) => (
          <div key={layer.label}>
            <motion.div
              className="flex items-center gap-4 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 cursor-pointer relative"
              style={{
                borderColor: expandedLayer === i ? `${layer.color}40` : `${layer.color}20`,
                backgroundColor: expandedLayer === i ? `${layer.color}10` : `${layer.color}06`,
              }}
              initial={{ opacity: 0, x: layer.type === "build" ? -20 : 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => setExpandedLayer(expandedLayer === i ? null : i)}
            >
              <div
                className="shrink-0 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: layer.type === "build" ? `${layer.color}20` : "rgba(255,255,255,0.06)",
                  color: layer.type === "build" ? layer.color : "rgb(148,163,184)",
                }}
              >
                {layer.type}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-white">{layer.label}</h4>
                <p className="text-xs text-slate-400">{layer.desc}</p>
              </div>
              <svg className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${expandedLayer === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>

            <AnimatePresence>
              {expandedLayer === i && (
                <motion.div
                  className="px-4 py-3 ml-4 sm:ml-14"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs text-slate-400 leading-relaxed italic">{layer.detail}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettleFluidTable() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="overflow-hidden rounded-2xl border border-white/8">
      {/* Desktop: 2-column table */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-2 border-b border-white/8">
          <div className="p-4 bg-emerald-500/8">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Settle on</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Stable foundations</p>
          </div>
          <div className="p-4 bg-cyan-500/8">
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Keep fluid</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Replaceable implementations</p>
          </div>
        </div>
        {settleVsFluid.map((row, i) => (
          <motion.div
            key={row.settle}
            className="grid grid-cols-2 border-b border-white/5 last:border-b-0"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <div className="p-4">
              <p className="text-sm text-slate-300">{row.settle}</p>
            </div>
            <div className="p-4 border-l border-white/5">
              <p className="text-sm text-slate-400">{row.fluid}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mobile: stacked cards */}
      <div className="sm:hidden divide-y divide-white/5">
        {settleVsFluid.map((row, i) => (
          <motion.div
            key={row.settle}
            className="p-4 space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <div>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Settle</p>
              <p className="text-sm text-slate-300">{row.settle}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Keep fluid</p>
              <p className="text-sm text-slate-400">{row.fluid}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ScrollDrawBuildBuy() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const barWidth = useTransform(scrollYProgress, [0, 0.4], ["0%", "100%"]);

  return (
    <div ref={containerRef}>
      <div className="mb-2">
        <div className="flex h-20 sm:h-14 rounded-xl overflow-hidden">
          <div className="flex-1 flex items-center justify-center bg-teal-500/20 border-r border-teal-500/10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="text-center">
                <span className="text-xs font-bold text-teal-400 block">BUILD</span>
                <span className="text-[11px] text-slate-400">Core differentiator</span>
              </div>
            </motion.div>
          </div>
          <div className="flex-1 flex items-center justify-center bg-white/4 border-r border-white/5">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="text-center">
                <span className="text-xs font-bold text-slate-300 block">CONFIGURE</span>
                <span className="text-[11px] text-slate-400">Platform + customization</span>
              </div>
            </motion.div>
          </div>
          <div className="flex-1 flex items-center justify-center bg-cyan-500/10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="text-center">
                <span className="text-xs font-bold text-cyan-400 block">BUY</span>
                <span className="text-[11px] text-slate-400">Commodity</span>
              </div>
            </motion.div>
          </div>
        </div>
        {/* Scroll-draw underline */}
        <div className="h-0.5 mt-1 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-linear-to-r from-teal-400 to-cyan-400 opacity-30"
            style={{ width: barWidth }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[11px] text-slate-400 uppercase tracking-wider">
          <span>Your competitive edge</span>
          <span>Everyone needs it</span>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-3 mt-8">
        <DiagramCard delay={0.1} gradient="from-teal-500/10 to-transparent">
          <p className="text-xs text-teal-400 uppercase tracking-widest mb-2 font-semibold">Build</p>
          <p className="text-sm text-slate-400 leading-relaxed">
            Risk engine, proprietary algorithms, unique customer experience, trade execution.
          </p>
        </DiagramCard>
        <DiagramCard delay={0.2}>
          <p className="text-xs text-slate-300 uppercase tracking-widest mb-2 font-semibold">Configure</p>
          <p className="text-sm text-slate-400 leading-relaxed">
            CRM workflows, analytics dashboards, approval chains, reporting.
          </p>
        </DiagramCard>
        <DiagramCard delay={0.3} gradient="from-cyan-500/10 to-transparent">
          <p className="text-xs text-cyan-400 uppercase tracking-widest mb-2 font-semibold">Buy</p>
          <p className="text-sm text-slate-400 leading-relaxed">
            Email, payroll, file storage, HR management, calendaring.
          </p>
        </DiagramCard>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Presentation
// ──────────────────────────────────────────────

export function SystemLandscapePresentation() {
  return (
    <SlideDeck slideCount={10} labels={SLIDE_LABELS} gradient="from-teal-400/60 via-emerald-400/60 to-cyan-400/60">
      {/* Grain texture overlay */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-10 opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain-sl">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-sl)" />
      </svg>

      {/* ═══════ Slide 0: HERO ═══════ */}
      <Slide index={0} variant="hero">
        {/* Background glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(20,184,166,0.08) 0%, rgba(20,184,166,0) 70%)" }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative text-center"
        >
          <motion.p
            className="text-teal-400 text-sm font-medium tracking-widest uppercase mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Strategic IT Architecture
          </motion.p>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4">
            <span className="bg-linear-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              System Landscape
            </span>
          </h1>

          <motion.p
            className="text-slate-500 text-lg md:text-xl tracking-wide max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            How to optimize your technology ecosystem for replaceability, not perfection
          </motion.p>
        </motion.div>

        <motion.div
          className="absolute bottom-12 flex flex-col items-center gap-2 text-slate-400"
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
        <PresentationSection eyebrow="Overview" title="What is a System Landscape?" gradient={GRADIENT}>
          <p className="text-xl text-slate-300 leading-relaxed font-light">
            The system landscape is the totality of applications, platforms,
            integrations, and infrastructure an enterprise operates. Most organizations
            don&apos;t design it — it accumulates. The result is complexity that slows
            every initiative and drains every budget.
          </p>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 2: Anti-patterns ═══════ */}
      <Slide index={2}>
        <PresentationSection eyebrow="The Problem" title="Why Most Enterprises Are Stuck" gradient={GRADIENT}>
          <p className="text-slate-400 leading-relaxed mb-8">
            Before optimizing, recognize the patterns that keep organizations
            trapped. These compound over time — each one reinforces the others.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {antiPatterns.map((item, i) => (
              <DiagramCard key={item.title} delay={i * 0.06}>
                <div className="flex items-start gap-3">
                  <span className="shrink-0 text-slate-500"><DrawSvg>{item.icon}</DrawSvg></span>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </DiagramCard>
            ))}
          </div>
          <InsightCallout gradient={GRADIENT}>
            Most enterprises exhibit at least four of these simultaneously.
            The dangerous ones aren&apos;t the patterns themselves — it&apos;s
            that leadership has normalized them as &quot;just how things work here.&quot;
          </InsightCallout>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 3: Three Approaches ═══════ */}
      <Slide index={3}>
        <PresentationSection eyebrow="Approaches" title="Three Strategic Directions" gradient={GRADIENT}>
          <p className="text-slate-400 leading-relaxed mb-8">
            Every enterprise faces the same fundamental choice. Each approach
            carries distinct trade-offs — but they are not equally effective.
          </p>
          <ApproachComparison />
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 4: Composable Architecture ═══════ */}
      <Slide index={4}>
        <PresentationSection eyebrow="Optimal Direction" title="The Composable Architecture" gradient={GRADIENT}>
          <p className="text-slate-400 leading-relaxed mb-4">
            Buy commodity capabilities. Build your competitive edge. Invest
            heavily in the integration layer that connects them. Click any layer
            to explore.
          </p>
          <p className="text-slate-400 leading-relaxed mb-8">
            The architecture below isn&apos;t theoretical — it&apos;s the pattern
            behind every enterprise that moves fast at scale.
          </p>
          <ComposableStack />
          <InsightCallout gradient={GRADIENT}>
            The integration layer is where most enterprises under-invest.
            They&apos;ll spend $20M on an ERP and $200K on the API gateway
            connecting it to everything else. That ratio is backwards.
          </InsightCallout>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 5: Settle vs. Fluid ═══════ */}
      <Slide index={5}>
        <PresentationSection eyebrow="Core Principle" title="Settle the Rules, Not the Tools" gradient={GRADIENT}>
          <p className="text-slate-400 leading-relaxed mb-8">
            Stability and flexibility are not opposites — you need both. The key
            is knowing which layer gets which. Settle on the interfaces and
            contracts. Keep the implementations behind them swappable.
          </p>
          <SettleFluidTable />
          <p className="text-sm text-slate-500 mt-4 italic">
            Like building a house — you settle on the foundation and plumbing
            standards. You don&apos;t weld the furniture to the floor.
          </p>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 6: Build vs. Buy (scrollable) ═══════ */}
      <Slide index={6} variant="scrollable">
        <PresentationSection eyebrow="Decision Framework" title="Build vs. Buy" gradient={GRADIENT}>
          <p className="text-slate-400 leading-relaxed mb-8">
            Every capability in your landscape falls on a spectrum. The closer it
            is to your competitive advantage, the more you should own it. Everything
            else is a commodity — buy it, integrate it, move on.
          </p>
          <ScrollDrawBuildBuy />
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 7: Success Metrics ═══════ */}
      <Slide index={7}>
        <PresentationSection eyebrow="Measuring Success" title="What Actually Matters" gradient={GRADIENT}>
          <p className="text-slate-400 leading-relaxed mb-8">
            The best system landscape isn&apos;t measured by how perfect it is today.
            It&apos;s measured by how fast you can change it tomorrow. Track these
            instead of chasing an ideal architecture diagram.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {successMetrics.map((m, i) => (
              <DiagramCard key={m.metric} delay={i * 0.08}>
                <div className="flex items-start gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border"
                    style={{ backgroundColor: `${m.color}15`, borderColor: `${m.color}30`, color: m.color }}
                    whileInView={{
                      scale: [1, 1.15, 1],
                    }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  >
                    <DrawSvg>{m.icon}</DrawSvg>
                  </motion.div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">{m.metric}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              </DiagramCard>
            ))}
          </div>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 8: Executive Summary ═══════ */}
      <Slide index={8}>
        <PresentationSection eyebrow="The Takeaway" title="For the Leadership Table" gradient={GRADIENT}>
          <div className="space-y-3">
            {[
              { text: "There is no ideal architecture — there is only an architecture that's cheap to change.", icon: ICONS.cycle },
              { text: "Consolidate where a capability is commoditized. Differentiate where it gives you competitive advantage.", icon: ICONS.target },
              { text: "Treat integration as a first-class capability, not an afterthought.", icon: ICONS.link },
              { text: "Settle on the rules. Stay flexible on the tools.", icon: ICONS.landmark },
              { text: "The enterprises that win don't pick the right systems — they can swap the wrong ones fast.", icon: ICONS.shuffle },
            ].map((point, i) => (
              <DiagramCard key={i} delay={i * 0.06}>
                <div className="flex items-start gap-3">
                  <span className="shrink-0 mt-0.5 text-teal-400/60"><DrawSvg>{point.icon}</DrawSvg></span>
                  <p className="text-sm text-slate-300 leading-relaxed">{point.text}</p>
                </div>
              </DiagramCard>
            ))}
          </div>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 9: Closing — So What? ═══════ */}
      <Slide index={9}>
        <PresentationSection eyebrow="So What?" title="What to Do Monday Morning" gradient={GRADIENT}>
          <div className="space-y-3 mb-8">
            <DiagramCard delay={0}>
              <div className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 text-teal-400/60"><DrawSvg>{ICONS.clipboardList}</DrawSvg></span>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Map your landscape. Not in a 6-month initiative — in a
                  spreadsheet this week. System name, owner, cost, replaceability score.
                </p>
              </div>
            </DiagramCard>
            <DiagramCard delay={0.08}>
              <div className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 text-teal-400/60"><DrawSvg>{ICONS.scissors}</DrawSvg></span>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Identify two systems you&apos;d struggle to replace. That&apos;s
                  where your risk lives. Start decoupling them from everything else.
                </p>
              </div>
            </DiagramCard>
            <DiagramCard delay={0.16}>
              <div className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 text-teal-400/60"><DrawSvg>{ICONS.wrench}</DrawSvg></span>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Fund the integration layer. It&apos;s not glamorous, but it&apos;s
                  the single investment that makes every future decision cheaper.
                </p>
              </div>
            </DiagramCard>
          </div>
          <TypewriterText
            text="The best system landscape isn't the one that's perfect today — it's the one that's easy to fix tomorrow."
            className="text-slate-400 text-sm tracking-wide italic text-center"
            speed={30}
          />
        </PresentationSection>
      </Slide>
    </SlideDeck>
  );
}

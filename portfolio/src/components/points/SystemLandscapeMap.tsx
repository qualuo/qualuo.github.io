"use client";

import { Fragment, useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { buildNodes, buildEdges, getStats, getDomain, MATURITY_LEVELS, type MaturityLevel } from "./landscape-map/data";
import { t, type Locale } from "./landscape-map/translations";
import { LocaleProvider } from "./landscape-map/LocaleContext";
import { SystemNode } from "./landscape-map/SystemNode";
import { DomainGroup } from "./landscape-map/DomainGroup";
import { IntegrationLayerNode } from "./landscape-map/IntegrationLayerNode";
import { ExternalSystemNode } from "./landscape-map/ExternalSystemNode";
import { TierBanner } from "./landscape-map/TierBanner";
import { OutcomeNode } from "./landscape-map/OutcomeNode";
import { DetailPanel } from "./landscape-map/DetailPanel";

const nodeTypes: NodeTypes = {
  systemNode: SystemNode,
  domainGroup: DomainGroup,
  integrationLayer: IntegrationLayerNode,
  externalSystem: ExternalSystemNode,
  tierBanner: TierBanner,
  outcomeNode: OutcomeNode,
};

// ──────────────────────────────────────────────
// Animated counter
// ──────────────────────────────────────────────

function AnimatedNumber({ value, duration = 600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const currentRef = useRef(value);

  useEffect(() => {
    const start = currentRef.current;
    const diff = value - start;
    if (diff === 0) return;

    const startTime = performance.now();
    let frame: number;

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(start + diff * eased);
      currentRef.current = val;
      setDisplay(val);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span className="font-mono tabular-nums">{display}</span>;
}

// ──────────────────────────────────────────────
// Stat pill — compact metric with delta
// ──────────────────────────────────────────────

function StatPill({ label, value, delta }: { label: string; value: number; delta: number | null }) {
  const improved = delta !== null && delta < 0;
  const worsened = delta !== null && delta > 0;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors duration-500 ${
      improved ? "bg-emerald-500/8" : "bg-white/[0.03]"
    }`}>
      <span className="text-[10px] text-white/35 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-white/80">
        <AnimatedNumber value={value} />
      </span>
      {delta !== null && delta !== 0 && (
        <span className={`text-[10px] font-semibold ${improved ? "text-emerald-400" : worsened ? "text-red-400" : ""}`}>
          {delta > 0 ? "+" : ""}{delta}
        </span>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────

export function SystemLandscapeMap() {
  const [level, setLevel] = useState<MaturityLevel>(3);
  const [locale, setLocale] = useState<Locale>("en");
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  const builtNodes = useMemo(() => buildNodes(level, locale), [level, locale]);
  const builtEdges = useMemo(() => buildEdges(level), [level]);

  const [nodes, setNodes, onNodesChange] = useNodesState(builtNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(builtEdges);

  useEffect(() => { setNodes(builtNodes); }, [builtNodes, setNodes]);
  useEffect(() => { setEdges(builtEdges); }, [builtEdges, setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === "systemNode") setSelectedSystem(node.id);
  }, []);

  const onPaneClick = useCallback(() => setSelectedSystem(null), []);

  const goNext = useCallback(() => {
    setLevel((l) => Math.min(5, l + 1) as MaturityLevel);
    setSelectedSystem(null);
  }, []);

  const goPrev = useCallback(() => {
    setLevel((l) => Math.max(1, l - 1) as MaturityLevel);
    setSelectedSystem(null);
  }, []);

  const isGoal = level >= 3;
  const stats = useMemo(() => getStats(level), [level]);
  const baseline = useMemo(() => getStats(2), []);
  const tx = t(locale);
  const currentMaturity = tx.maturity[level - 1];

  return (
    <LocaleProvider value={locale}>
    <div className="relative w-full h-full" style={{ minHeight: "100dvh" }}>
      {/* Maturity toolbar — flush below glass navbar */}
      <div className="absolute top-14 left-0 right-0 z-40">
        <div className={`
          flex items-center justify-between gap-3 px-4 py-1.5
          backdrop-blur-2xl border-b
          transition-colors duration-700
          ${isGoal
            ? "bg-indigo-500/[0.03] border-indigo-400/8"
            : "bg-white/2 border-white/4"
          }
        `}>
          {/* Left: keyboard hint + maturity stepper + level info */}
          <div className="flex items-center gap-3 shrink-0">
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-white/20 shrink-0">← →</kbd>
            <div className="flex items-center">
              {MATURITY_LEVELS.map((ml, i) => (
                <Fragment key={ml.level}>
                  {i > 0 && (
                    <div className={`w-3 h-px transition-colors duration-300 ${
                      ml.level <= level ? "bg-indigo-400/30" : "bg-white/5"
                    }`} />
                  )}
                  <button
                    onClick={() => { setLevel(ml.level); setSelectedSystem(null); }}
                    className={`
                      w-7 h-7 rounded-full text-xs font-semibold transition-all duration-300
                      ${ml.level === level
                        ? "bg-indigo-500/30 text-indigo-300 ring-1 ring-indigo-400/30 scale-110"
                        : ml.level < level
                          ? "bg-white/8 text-white/50"
                          : "bg-white/[0.03] text-white/20 hover:bg-white/5"
                      }
                    `}
                    title={`${tx.maturity[i].name}: ${tx.maturity[i].description}`}
                  >
                    {ml.level}
                  </button>
                </Fragment>
              ))}
            </div>
            <div className="min-w-0">
              <div className={`text-xs font-semibold transition-colors duration-500 ${isGoal ? "text-indigo-300" : "text-white/80"}`}>
                {currentMaturity.name}
              </div>
              <div className="text-[10px] text-white/25">
                {currentMaturity.description}
              </div>
            </div>
          </div>

          {/* Right: stats + locale toggle */}
          <div className="flex items-center gap-1.5">
            <StatPill label={tx.stats.systems} value={stats.systems} delta={isGoal ? stats.systems - baseline.systems : null} />
            <StatPill label={tx.stats.integrations} value={stats.integrations} delta={isGoal ? stats.integrations - baseline.integrations : null} />
            <StatPill label={tx.stats.vendors} value={stats.vendors} delta={isGoal ? stats.vendors - baseline.vendors : null} />
            <StatPill label={tx.stats.risks} value={stats.criticalRisks} delta={isGoal ? stats.criticalRisks - baseline.criticalRisks : null} />

            <div className="flex items-center rounded-md bg-white/[0.03] border border-white/5 ml-1">
              <button
                onClick={() => setLocale("en")}
                className={`px-2 py-1 text-[10px] font-semibold tracking-wide transition-colors ${
                  locale === "en" ? "text-white/90" : "text-white/25 hover:text-white/40"
                }`}
              >
                EN
              </button>
              <div className="w-px h-3.5 bg-white/8" />
              <button
                onClick={() => setLocale("sv")}
                className={`px-2 py-1 text-[10px] font-semibold tracking-wide transition-colors ${
                  locale === "sv" ? "text-white/90" : "text-white/25 hover:text-white/40"
                }`}
              >
                SV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="!bg-[#0a0a0a]"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.04)" />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === "domainGroup") return "transparent";
            if (n.type === "integrationLayer") return "rgba(99,102,241,0.4)";
            const domain = (n.data as Record<string, unknown>).domain as string;
            return domain ? getDomain(domain).color : "rgba(255,255,255,0.2)";
          }}
          maskColor="rgba(0,0,0,0.85)"
          bgColor="#111"
          className="!bg-[#111] !border-white/5 !rounded-lg"
          pannable
          zoomable
        />
        <Controls
          showInteractive={false}
          className="!bg-[#111] !border-white/8 !rounded-lg [&>button]:!bg-transparent [&>button]:!border-white/5 [&>button]:!text-white/40 [&>button:hover]:!bg-white/5"
        />
      </ReactFlow>

      {/* Detail panel */}
      <DetailPanel
        systemId={selectedSystem}
        state={level <= 2 ? "as-is" : "goal"}
        onClose={() => setSelectedSystem(null)}
      />

      <KeyboardShortcuts onPrev={goPrev} onNext={goNext} onJump={(l) => { setLevel(l); setSelectedSystem(null); }} />
    </div>
    </LocaleProvider>
  );
}

function KeyboardShortcuts({ onPrev, onNext, onJump }: { onPrev: () => void; onNext: () => void; onJump: (l: MaturityLevel) => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        onPrev();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        onNext();
      } else if (e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        onJump(Number(e.key) as MaturityLevel);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onPrev, onNext, onJump]);

  return null;
}

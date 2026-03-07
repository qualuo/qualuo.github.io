"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SYSTEMS, NEW_SYSTEMS, getDomain, type SystemData } from "./data";
import { useLocale } from "./LocaleContext";
import { t } from "./translations";

interface DetailPanelProps {
  systemId: string | null;
  state: "as-is" | "goal";
  onClose: () => void;
}

const HEALTH_COLORS: Record<string, string> = {
  healthy: "text-emerald-400",
  warning: "text-amber-400",
  critical: "text-red-400",
};

const ACTION_COLORS: Record<string, string> = {
  keep: "text-emerald-400",
  modernize: "text-blue-400",
  sunset: "text-red-400",
  consolidate: "text-amber-400",
  new: "text-indigo-400",
};

function findSystem(id: string): SystemData | undefined {
  return SYSTEMS.find((s) => s.id === id) ?? NEW_SYSTEMS.find((s) => s.id === id);
}

export function DetailPanel({ systemId, state, onClose }: DetailPanelProps) {
  const locale = useLocale();
  const tx = t(locale);
  const system = systemId ? findSystem(systemId) : null;
  const sysTx = system ? tx.systems[system.id] : undefined;

  return (
    <AnimatePresence>
      {system && (
        <motion.div
          key={system.id}
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute top-0 right-0 h-full w-[340px] bg-[#111]/95 backdrop-blur-xl border-l border-white/8 z-50 overflow-y-auto"
        >
          <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div
                  className="text-sm font-semibold text-white/90"
                  style={{ color: getDomain(system.domain, locale).color }}
                >
                  {getDomain(system.domain, locale).label}
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">{sysTx?.label ?? system.label}</h3>
                <div className="text-xs text-white/40 mt-0.5">{system.vendor}</div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
                <div className="text-[10px] text-white/30 uppercase">{tx.detail.deployed}</div>
                <div className="text-sm text-white/80 font-medium">{system.yearDeployed}</div>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
                <div className="text-[10px] text-white/30 uppercase">{tx.detail.annualCost}</div>
                <div className="text-sm text-white/80 font-medium">{system.annualCost}</div>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
                <div className="text-[10px] text-white/30 uppercase">{tx.detail.health}</div>
                <div className={`text-sm font-medium ${HEALTH_COLORS[system.health]}`}>
                  {tx.health[system.health]}
                </div>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
                <div className="text-[10px] text-white/30 uppercase">{tx.detail.integrations}</div>
                <div className="text-sm text-white/80 font-medium">{system.integrationCount}</div>
              </div>
            </div>

            {/* As-Is: Pain points */}
            {state === "as-is" && system.painPoints && system.painPoints.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] text-white/30 uppercase mb-2">{tx.detail.painPoints}</div>
                <div className="space-y-1.5">
                  {(sysTx?.painPoints ?? system.painPoints).map((pp, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-red-400/70">
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400/50 shrink-0" />
                      {pp}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Goal: Recommendation */}
            {state === "goal" && (
              <div className="mb-4">
                <div className="text-[10px] text-white/30 uppercase mb-2">{tx.detail.recommendation}</div>
                <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                  <div className={`text-xs font-semibold mb-1 ${ACTION_COLORS[system.goalAction]}`}>
                    {tx.actions[system.goalAction]}
                  </div>
                  {(sysTx?.goalNote ?? system.goalNote) && (
                    <div className="text-xs text-white/50 leading-relaxed">
                      {sysTx?.goalNote ?? system.goalNote}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* System age indicator */}
            {(() => {
              const age = 2026 - system.yearDeployed;
              const ageColor = age > 10 ? "text-red-400" : age > 5 ? "text-amber-400" : "text-emerald-400";
              return (
                <div className="text-xs text-white/30">
                  {tx.detail.systemAge}: <span className={ageColor}>{age} {tx.detail.years}</span>
                </div>
              );
            })()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

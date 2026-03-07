"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { SystemData } from "./data";

interface BadgeLabels {
  int: string;
  issue: string;
  issues: string;
  sunset: string;
  new: string;
  federated: string;
  modernized: string;
  also: string;
  [key: string]: string;
}

interface SystemNodeData extends SystemData {
  isSunset: boolean;
  isNew: boolean;
  isManual: boolean;
  isModernized: boolean;
  isFederated: boolean;
  state: "as-is" | "goal";
  domainColor: string;
  badgeLabels: BadgeLabels;
  [key: string]: unknown;
}

const HEALTH_COLORS: Record<string, string> = {
  healthy: "#4ade80",
  warning: "#fbbf24",
  critical: "#f87171",
};

function SystemNodeComponent({ data, selected }: NodeProps) {
  const d = data as unknown as SystemNodeData;
  const isSunset = d.isSunset;
  const isNew = d.isNew;
  const isManual = d.isManual;
  const isModernized = d.isModernized;
  const isFederated = d.isFederated;

  return (
    <div
      className={`
        relative group w-[180px] rounded-lg border transition-all duration-500
        ${selected ? "ring-2 ring-white/30 scale-105" : ""}
        ${isSunset
          ? "opacity-35 border-white/5 bg-white/[0.02]"
          : isManual
            ? "opacity-50 border-white/6 bg-white/[0.02]"
            : isNew
              ? "border-indigo-400/40 bg-indigo-500/[0.08] shadow-[0_0_20px_rgba(99,102,241,0.15)]"
              : "border-white/8 bg-white/[0.04] hover:bg-white/[0.07]"
        }
      `}
      style={{ borderLeftColor: isSunset ? undefined : d.domainColor, borderLeftWidth: isSunset ? undefined : 3 }}
    >
      <Handle type="target" position={Position.Top} id="top" className="!w-1 !h-1 !bg-transparent !border-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-1 !h-1 !bg-transparent !border-0" />
      <Handle type="target" position={Position.Left} id="left" className="!w-1 !h-1 !bg-transparent !border-0" />
      <Handle type="source" position={Position.Right} id="right" className="!w-1 !h-1 !bg-transparent !border-0" />

      <div className="px-3 py-2.5">
        {/* Header row: name + health dot */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold leading-tight ${isSunset ? "line-through text-white/30" : "text-white/90"}`}
          >
            {d.label}
          </span>
          {!isSunset && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: HEALTH_COLORS[d.health] }}
              title={d.health}
            />
          )}
        </div>

        {/* Vendor */}
        <div className={`text-[10px] mt-0.5 ${isSunset ? "text-white/15" : "text-white/40"}`}>
          {d.vendor}
        </div>
        {d.alternatives && d.alternatives.length > 0 && !isSunset && (
          <div className="text-[9px] text-white/20 mt-px">
            {d.badgeLabels.also}: {d.alternatives.join(", ")}
          </div>
        )}

        {/* Badges */}
        <div className="flex items-center gap-1.5 mt-1.5">
          {!isSunset && d.integrationCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
              {d.integrationCount} {d.badgeLabels.int}
            </span>
          )}
          {d.state === "as-is" && d.painPoints && d.painPoints.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400/70">
              {d.painPoints.length} {d.painPoints.length > 1 ? d.badgeLabels.issues : d.badgeLabels.issue}
            </span>
          )}
          {isSunset && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400/50">
              {d.badgeLabels.sunset}
            </span>
          )}
          {isNew && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300/70">
              {d.badgeLabels.new}
            </span>
          )}
          {isFederated ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300/70">
              {d.badgeLabels.federated}
            </span>
          ) : isModernized ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/70">
              {d.badgeLabels.modernized}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const SystemNode = memo(SystemNodeComponent);

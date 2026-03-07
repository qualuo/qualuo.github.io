"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface ExternalNodeData {
  label: string;
  tier: "supranational" | "national" | "regional";
  description: string;
  domainColor: string;
  emerging?: boolean;
  isGateway?: boolean;
  tierBadge: string;
  gatewayBadge: string;
  [key: string]: unknown;
}

const TIER_STYLES = {
  supranational: {
    border: "border-fuchsia-400/20",
    bg: "bg-fuchsia-500/[0.03]",
    accent: "#e879f9",
    badge: "bg-fuchsia-500/10 text-fuchsia-300/60",
  },
  national: {
    border: "border-amber-400/30",
    bg: "bg-amber-500/[0.06]",
    accent: "#f59e0b",
    badge: "bg-amber-500/15 text-amber-300/80",
  },
  regional: {
    border: "border-violet-400/30",
    bg: "bg-violet-500/[0.06]",
    accent: "#a78bfa",
    badge: "bg-violet-500/15 text-violet-300/80",
  },
};

function ExternalSystemNodeComponent({ data }: NodeProps) {
  const d = data as unknown as ExternalNodeData;
  const style = TIER_STYLES[d.tier];
  const isEmerging = d.emerging;
  const isGateway = d.isGateway;

  if (isGateway) {
    const gw = {
      national: { border: "border-amber-400/30", bg: "bg-amber-500/[0.04]", shadow: "shadow-[0_0_30px_rgba(245,158,11,0.08)]", handle: "!bg-amber-400/40", title: "text-amber-300/80", badge: "bg-amber-500/15 text-amber-300/70" },
      regional: { border: "border-violet-400/30", bg: "bg-violet-500/[0.04]", shadow: "shadow-[0_0_30px_rgba(167,139,250,0.08)]", handle: "!bg-violet-400/40", title: "text-violet-300/80", badge: "bg-violet-500/15 text-violet-300/70" },
      supranational: { border: "border-fuchsia-400/30", bg: "bg-fuchsia-500/[0.04]", shadow: "shadow-[0_0_30px_rgba(232,121,249,0.08)]", handle: "!bg-fuchsia-400/40", title: "text-fuchsia-300/80", badge: "bg-fuchsia-500/15 text-fuchsia-300/70" },
    }[d.tier];

    return (
      <div className={`relative w-[400px] rounded-xl border ${gw.border} ${gw.bg} ${gw.shadow}`}>
        <Handle type="target" position={Position.Top} id="top" className="!w-1 !h-1 !bg-transparent !border-0" />
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-1 !h-1 !bg-transparent !border-0" />
        <Handle type="source" position={Position.Right} id="right" className="!w-1 !h-1 !bg-transparent !border-0" />
        <Handle type="target" position={Position.Left} id="left" className="!w-1 !h-1 !bg-transparent !border-0" />

        <div className="px-5 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${gw.title}`}>{d.label}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${gw.badge}`}>
              {d.gatewayBadge}
            </span>
          </div>
          <div className="text-[10px] text-white/35 leading-snug">{d.description}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-[180px] rounded-lg border ${isEmerging ? "border-dotted" : "border-dashed"} ${style.border} ${style.bg}`}
      style={{
        borderLeftColor: style.accent,
        borderLeftWidth: 3,
        borderLeftStyle: isEmerging ? "dotted" : "solid",
        opacity: isEmerging ? 0.55 : 1,
      }}
    >
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-1 !h-1 !bg-transparent !border-0" />
      <Handle type="target" position={Position.Top} id="top" className="!w-1 !h-1 !bg-transparent !border-0" />

      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold leading-tight ${isEmerging ? "text-white/50" : "text-white/80"}`}>{d.label}</span>
        </div>
        <div className={`text-[10px] leading-snug mb-1.5 ${isEmerging ? "text-white/25" : "text-white/35"}`}>{d.description}</div>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${style.badge}`}>
          {d.tierBadge}
        </span>
      </div>
    </div>
  );
}

export const ExternalSystemNode = memo(ExternalSystemNodeComponent);

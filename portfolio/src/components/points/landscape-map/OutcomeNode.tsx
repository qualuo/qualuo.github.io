"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";

interface OutcomeNodeData {
  label: string;
  before: string;
  after: string;
  [key: string]: unknown;
}

function OutcomeNodeComponent({ data }: NodeProps) {
  const d = data as unknown as OutcomeNodeData;

  return (
    <div className="w-[190px] rounded-md border border-emerald-400/25 bg-emerald-500/[0.06] px-3 py-2">
      <div className="text-[10px] font-medium text-emerald-300/70 uppercase tracking-wide mb-1">
        {d.label}
      </div>
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className="text-white/40 shrink-0">{d.before}</span>
        <span className="text-emerald-400/60 shrink-0">→</span>
        <span className="text-emerald-300 font-semibold">{d.after}</span>
      </div>
    </div>
  );
}

export const OutcomeNode = memo(OutcomeNodeComponent);

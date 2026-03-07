"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface ComponentDef {
  name: string;
  icon: string;
  description: string;
  vendors: string;
}

interface IntegrationLayerData {
  label: string;
  components: ComponentDef[];
  [key: string]: unknown;
}

function IntegrationLayerComponent({ data }: NodeProps) {
  const d = data as unknown as IntegrationLayerData;

  return (
    <div className="relative w-[1200px] rounded-xl border border-indigo-400/30 bg-indigo-500/[0.06] shadow-[0_0_40px_rgba(99,102,241,0.1)]">
      <Handle type="target" position={Position.Top} id="top" className="!w-1 !h-1 !bg-transparent !border-0" />
      <Handle type="target" position={Position.Left} id="left" className="!w-1 !h-1 !bg-transparent !border-0" />
      <Handle type="source" position={Position.Left} id="source-left" className="!w-1 !h-1 !bg-transparent !border-0" style={{ top: "75%" }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" className="!w-1 !h-1 !bg-transparent !border-0" />
      <Handle type="source" position={Position.Right} id="source-right" className="!w-1 !h-1 !bg-transparent !border-0" style={{ top: "75%" }} />

      <div className="px-6 py-4">
        <div className="text-xs font-semibold text-indigo-300/80 uppercase tracking-wider mb-4">
          {d.label}
        </div>
        <div className="flex gap-4">
          {d.components.map((comp) => (
            <div
              key={comp.name}
              className="flex-1 rounded-lg border border-indigo-400/15 bg-indigo-500/[0.06] px-4 py-3"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{comp.icon}</span>
                <span className="text-[11px] font-semibold text-white/80">{comp.name}</span>
              </div>
              <div className="text-[10px] text-white/35 leading-snug mb-2">{comp.description}</div>
              <div className="text-[9px] text-indigo-300/50">{comp.vendors}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const IntegrationLayerNode = memo(IntegrationLayerComponent);

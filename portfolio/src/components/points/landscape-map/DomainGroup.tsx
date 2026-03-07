"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";

interface DomainGroupData {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  width: number;
  height: number;
  hasOutcome?: boolean;
  [key: string]: unknown;
}

function DomainGroupComponent({ data }: NodeProps) {
  const d = data as unknown as DomainGroupData;

  return (
    <div
      className="rounded-xl border border-dashed pointer-events-none relative"
      style={{
        width: d.width,
        height: d.height,
        backgroundColor: d.bgColor,
        borderColor: d.borderColor,
      }}
    >
      {/* Opaque header masks edges routing through the label area */}
      <div
        className="rounded-t-xl px-3 py-1.5"
        style={{ backgroundColor: `color-mix(in srgb, ${d.color} 6%, #0a0a0a)` }}
      >
        <div
          className="text-[11px] font-semibold tracking-wide uppercase"
          style={{ color: d.color }}
        >
          {d.label}
        </div>
      </div>
      {d.hasOutcome && (
        <div
          className="absolute left-4 right-4"
          style={{
            bottom: 90,
            borderTop: `1px dashed ${d.borderColor}`,
          }}
        />
      )}
    </div>
  );
}

export const DomainGroup = memo(DomainGroupComponent);

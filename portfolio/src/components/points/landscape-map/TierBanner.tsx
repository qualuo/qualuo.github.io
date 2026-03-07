"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";

interface TierBannerData {
  label: string;
  sublabel: string;
  color: string;
  width: number;
  height?: number;
  tags?: { label: string; info: string }[];
  [key: string]: unknown;
}

function TierBannerComponent({ data }: NodeProps) {
  const d = data as unknown as TierBannerData;

  return (
    <div
      className="pointer-events-none relative"
      style={{ width: d.width, height: d.height }}
    >
      {/* Background band */}
      {d.height && (
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            backgroundColor: `color-mix(in srgb, ${d.color} 4%, transparent)`,
            borderBottom: `1px solid color-mix(in srgb, ${d.color} 10%, transparent)`,
          }}
        />
      )}

      <div className="relative px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 opacity-20" style={{ backgroundColor: d.color }} />
          <div className="text-center shrink-0">
            <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: d.color }}>
              {d.label}
            </div>
            <div className="text-[9px] text-white/25">{d.sublabel}</div>
          </div>
          <div className="h-px flex-1 opacity-20" style={{ backgroundColor: d.color }} />
        </div>
        {d.tags && d.tags.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            {d.tags.map((tag) => (
              <div
                key={tag.label}
                className="group/tag relative pointer-events-auto cursor-default"
              >
                <span
                  className="text-[9px] px-2 py-0.5 rounded-full font-medium border border-dashed inline-block"
                  style={{
                    color: d.color,
                    borderColor: `color-mix(in srgb, ${d.color} 25%, transparent)`,
                    backgroundColor: `color-mix(in srgb, ${d.color} 6%, transparent)`,
                  }}
                >
                  {tag.label}
                </span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-md bg-[#1a1a1a] border border-white/10 shadow-xl opacity-0 group-hover/tag:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  <div className="text-[10px] text-white/60 leading-snug max-w-[240px] whitespace-normal text-center">{tag.info}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const TierBanner = memo(TierBannerComponent);

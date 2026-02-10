"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const ITEMS = [
  { label: "Chatbots & Assistants", position: 90, color: "#22C55E" },
  { label: "Summarization", position: 85, color: "#22C55E" },
  { label: "RAG / Search", position: 80, color: "#22C55E" },
  { label: "Code Assistance", position: 75, color: "#4ADE80" },
  { label: "Content Generation", position: 70, color: "#A3E635" },
  { label: "Data Extraction", position: 65, color: "#A3E635" },
  { label: "Multi-Agent Systems", position: 40, color: "#FBBF24" },
  { label: "Autonomous Agents", position: 25, color: "#F97316" },
  { label: "Self-Improving AI", position: 10, color: "#EF4444" },
  { label: "AGI", position: 3, color: "#EF4444" },
];

export function HypeRealitySpectrum() {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  return (
    <div className="w-full py-2">
      {/* Axis labels */}
      <div className="flex justify-between mb-4 px-1">
        <span className="text-[11px] font-semibold text-red-400/80 uppercase tracking-wider">
          Hype
        </span>
        <span className="text-[11px] font-semibold text-emerald-400/80 uppercase tracking-wider">
          Production-Ready
        </span>
      </div>

      {/* Items as horizontal bar chart — no overlap possible */}
      <div className="space-y-1.5">
        {ITEMS.map((item, i) => {
          const isHovered = hoveredItem === i;
          return (
            <motion.div
              key={item.label}
              className="group flex items-center gap-3 cursor-default"
              onHoverStart={() => setHoveredItem(i)}
              onHoverEnd={() => setHoveredItem(null)}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              {/* Label — fixed width for alignment */}
              <span
                className="text-[10px] sm:text-[12px] font-medium w-20 sm:w-36 shrink-0 text-right transition-colors duration-200"
                style={{ color: isHovered ? item.color : "rgb(180,190,210)" }}
              >
                {item.label}
              </span>

              {/* Bar track */}
              <div className="flex-1 h-5 rounded-full bg-white/4 relative overflow-hidden">
                {/* Filled bar */}
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ backgroundColor: `${item.color}${isHovered ? "40" : "20"}` }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.position}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 + 0.2, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                />
                {/* Dot at end */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-transform duration-200"
                  style={{
                    left: `${item.position}%`,
                    transform: `translateX(-50%) translateY(-50%) scale(${isHovered ? 1.4 : 1})`,
                    backgroundColor: item.color,
                    boxShadow: isHovered ? `0 0 10px ${item.color}50` : "none",
                  }}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 + 0.5 }}
                />
              </div>

              {/* Percentage */}
              <span
                className="text-[11px] font-mono w-8 shrink-0 tabular-nums transition-colors duration-200"
                style={{ color: isHovered ? item.color : "rgb(100,116,139)" }}
              >
                {item.position}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

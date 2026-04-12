"use client";

import Link from "next/link";
import { Point } from "@/lib/points";
import { Navbar } from "@/components/layout/Navbar";
import { lazy, Suspense } from "react";

const TogafPresentation = lazy(() =>
  import("@/components/points/TogafPresentation").then((m) => ({
    default: m.TogafPresentation,
  }))
);

const SystemLandscapePresentation = lazy(() =>
  import("@/components/points/SystemLandscapePresentation").then((m) => ({
    default: m.SystemLandscapePresentation,
  }))
);

const AIArchitecturePaper = lazy(() =>
  import("@/components/points/AIArchitecturePaper").then((m) => ({
    default: m.AIArchitecturePaper,
  }))
);

const SystemLandscapeMap = lazy(() =>
  import("@/components/points/SystemLandscapeMap").then((m) => ({
    default: m.SystemLandscapeMap,
  }))
);

const HierarchicalGovernancePaper = lazy(() =>
  import("@/components/points/HierarchicalGovernancePaper").then((m) => ({
    default: m.HierarchicalGovernancePaper,
  }))
);

const POINT_COMPONENTS: Record<string, React.ComponentType> = {
  togaf: TogafPresentation,
  "system-landscape": SystemLandscapePresentation,
  "ai-architecture": AIArchitecturePaper,
  "system-landscape-map": SystemLandscapeMap,
  "hierarchical-governance": HierarchicalGovernancePaper,
};

interface PointPageClientProps {
  point: Point | undefined;
}

export function PointPageClient({ point }: PointPageClientProps) {
  if (!point) {
    return (
      <main className="relative min-h-screen flex items-center justify-center">

        <div className="text-center">
          <h1 className="text-4xl font-light tracking-tight text-white mb-4">
            Presentation Not Found
          </h1>
          <Link
            href="/points"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/6 text-slate-300 font-light hover:bg-white/10 transition-colors border border-white/6"
          >
            Back to Points
          </Link>
        </div>
      </main>
    );
  }

  const PresentationComponent = POINT_COMPONENTS[point.slug];

  const isPaper = point.format === "paper";
  const isFullCanvas = point.format === "whiteboard";

  return (
    <main
      className={`relative ${isPaper ? "min-h-dvh" : "h-dvh overflow-hidden"}`}
    >

      <Navbar isSubpage glass={isFullCanvas} hasStars={!isFullCanvas} />

      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        }
      >
        {PresentationComponent ? (
          <PresentationComponent />
        ) : (
          <div className="pt-32 text-center">
            <p className="text-slate-400">Presentation coming soon</p>
          </div>
        )}
      </Suspense>
    </main>
  );
}

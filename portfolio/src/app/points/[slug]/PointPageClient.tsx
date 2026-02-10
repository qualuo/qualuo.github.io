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

const POINT_COMPONENTS: Record<string, React.ComponentType> = {
  togaf: TogafPresentation,
  "system-landscape": SystemLandscapePresentation,
  "ai-architecture": AIArchitecturePaper,
};

function DotGrid() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    />
  );
}

interface PointPageClientProps {
  point: Point | undefined;
}

export function PointPageClient({ point }: PointPageClientProps) {
  if (!point) {
    return (
      <main className="relative min-h-screen flex items-center justify-center">
        <DotGrid />
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

  return (
    <main
      className={`relative ${isPaper ? "min-h-dvh" : "h-dvh overflow-hidden"}`}
    >
      <DotGrid />
      <Navbar isSubpage hasStars={false} />

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
            <p className="text-slate-400">Presentation coming soon.</p>
          </div>
        )}
      </Suspense>
    </main>
  );
}

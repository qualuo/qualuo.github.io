"use client";

import dynamic from "next/dynamic";

export const StarsBackgroundLazy = dynamic(
  () =>
    import("@/components/animations/StarsBackground").then((m) => ({
      default: m.StarsBackground,
    })),
  { ssr: false }
);

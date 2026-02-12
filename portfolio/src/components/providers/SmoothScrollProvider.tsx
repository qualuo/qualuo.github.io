"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const DISABLED_ROUTES = ["/rfcs"];

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const disabled = DISABLED_ROUTES.some((r) => pathname.startsWith(r));
  const lenisRef = useRef<{ destroy: () => void } | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (disabled) return;

    let cancelled = false;

    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;

      const lenis = new Lenis({
        lerp: 0.08,
        wheelMultiplier: 0.8,
        smoothWheel: true,
        prevent: (node: HTMLElement) =>
          node.closest("[data-slide-deck]") !== null,
      });

      lenisRef.current = lenis;

      function raf(time: number) {
        lenis.raf(time);
        rafRef.current = requestAnimationFrame(raf);
      }

      rafRef.current = requestAnimationFrame(raf);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [disabled]);

  return <>{children}</>;
}

import { useEffect } from "react";
import { useMotionValue, useSpring } from "framer-motion";

/** Mouse parallax anchored to Polaris — (mouse-0.5)*20px with soft spring. */
export function usePolarisParallax() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 50, damping: 18 });
  const y = useSpring(my, { stiffness: 50, damping: 18 });

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 20);
      my.set((e.clientY / window.innerHeight - 0.5) * 20);
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => window.removeEventListener("mousemove", onMouse);
  }, [mx, my]);

  return { x, y };
}

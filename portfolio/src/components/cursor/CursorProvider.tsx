"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";

const DISABLED_ROUTES = ["/rfcs"];

export type CursorVariant =
  | "default"
  | "pointer"
  | "text"
  | "view"
  | "drag"
  | "hidden"
  | "loading";

interface CursorContextType {
  variant: CursorVariant;
  text: string;
  isHovering: boolean;
  setVariant: (variant: CursorVariant) => void;
  setText: (text: string) => void;
  setIsHovering: (hovering: boolean) => void;
}

const CursorContext = createContext<CursorContextType | null>(null);

export function CursorProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const disabled = DISABLED_ROUTES.some((r) => pathname.startsWith(r));
  const [variant, setVariant] = useState<CursorVariant>("default");
  const [text, setText] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch devices
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        "ontouchstart" in window || navigator.maxTouchPoints > 0
      );
    };
    checkTouch();
    window.addEventListener("touchstart", () => setIsTouchDevice(true), {
      once: true,
    });
  }, []);

  // Global event listener for data-cursor attributes
  useEffect(() => {
    if (isTouchDevice || disabled) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cursorElement = target.closest("[data-cursor]") as HTMLElement;

      if (cursorElement) {
        const cursorType = cursorElement.dataset.cursor as CursorVariant;
        const cursorText = cursorElement.dataset.cursorText || "";

        setVariant(cursorType || "pointer");
        setText(cursorText);
        setIsHovering(true);
      } else {
        // Check if hovering over interactive elements
        const interactive = target.closest(
          "a, button, [role='button'], input, textarea, select, [tabindex]:not([tabindex='-1'])"
        );
        if (interactive) {
          setVariant("pointer");
          setIsHovering(true);
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const relatedTarget = e.relatedTarget as HTMLElement;

      // Check if we're leaving a cursor element
      const cursorElement = target.closest("[data-cursor]");
      const nextCursorElement = relatedTarget?.closest?.("[data-cursor]");

      if (cursorElement && !nextCursorElement) {
        setVariant("default");
        setText("");
        setIsHovering(false);
      }

      // Check if leaving interactive element
      const interactive = target.closest(
        "a, button, [role='button'], input, textarea, select, [tabindex]:not([tabindex='-1'])"
      );
      const nextInteractive = relatedTarget?.closest?.(
        "a, button, [role='button'], input, textarea, select, [tabindex]:not([tabindex='-1'])"
      );

      if (interactive && !nextInteractive && !nextCursorElement) {
        setVariant("default");
        setIsHovering(false);
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, [isTouchDevice, disabled]);

  // Hide default cursor globally
  useEffect(() => {
    if (isTouchDevice || disabled) return;

    document.body.style.cursor = "none";

    // Also hide cursor on all elements
    const style = document.createElement("style");
    style.id = "custom-cursor-style";
    style.textContent = `
      *, *::before, *::after {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.body.style.cursor = "";
      const existingStyle = document.getElementById("custom-cursor-style");
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [isTouchDevice, disabled]);

  const value = {
    variant,
    text,
    isHovering,
    setVariant: useCallback((v: CursorVariant) => setVariant(v), []),
    setText: useCallback((t: string) => setText(t), []),
    setIsHovering: useCallback((h: boolean) => setIsHovering(h), []),
  };

  return (
    <CursorContext.Provider value={value}>{children}</CursorContext.Provider>
  );
}

export function useCursor() {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error("useCursor must be used within a CursorProvider");
  }
  return context;
}

// Hook for setting cursor on mount/unmount
export function useCursorHover(
  variant: CursorVariant,
  text?: string
): {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
} {
  const { setVariant, setText, setIsHovering } = useCursor();

  return {
    onMouseEnter: useCallback(() => {
      setVariant(variant);
      setText(text || "");
      setIsHovering(true);
    }, [variant, text, setVariant, setText, setIsHovering]),
    onMouseLeave: useCallback(() => {
      setVariant("default");
      setText("");
      setIsHovering(false);
    }, [setVariant, setText, setIsHovering]),
  };
}

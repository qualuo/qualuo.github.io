"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface TimeLapseContextType {
  isActive: boolean;
  toggle: () => void;
  setActive: (active: boolean) => void;
}

const TimeLapseContext = createContext<TimeLapseContextType | null>(null);

export function TimeLapseProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);

  const toggle = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  const setActive = useCallback((active: boolean) => {
    setIsActive(active);
  }, []);

  return (
    <TimeLapseContext.Provider value={{ isActive, toggle, setActive }}>
      {children}
    </TimeLapseContext.Provider>
  );
}

export function useTimeLapse() {
  const context = useContext(TimeLapseContext);
  if (!context) {
    throw new Error("useTimeLapse must be used within TimeLapseProvider");
  }
  return context;
}

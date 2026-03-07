"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./translations";

const LocaleContext = createContext<Locale>("en");

export const LocaleProvider = LocaleContext.Provider;
export function useLocale() {
  return useContext(LocaleContext);
}

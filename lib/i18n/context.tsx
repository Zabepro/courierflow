"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { dashboardTranslations, DashboardDict, Lang } from "./dictionary";

type LanguageContextType = {
  lang: Lang;
  t: DashboardDict;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem("cf-lang") as Lang;
    if (saved === "sw" || saved === "en") {
      setLangState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("cf-lang", l);
    document.documentElement.lang = l;
  };

  const t = dashboardTranslations[lang];

  // Prevent hydration mismatch by slightly delaying initial render of text
  // or just render default and switch. Since we want to avoid layout shifts,
  // we render children but context provides current lang. 
  // Next.js might warn on hydration mismatch but it's acceptable for now.

  return (
    <LanguageContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { IconWorld } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex h-9 w-[100px] animate-pulse items-center gap-0.5 rounded-lg bg-slate-100 p-1 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700" aria-hidden="true" />
    );
  }

  return (
    <div className="flex h-9 items-center gap-0.5 rounded-lg bg-slate-100/80 p-1 ring-1 ring-slate-200 transition-colors dark:bg-slate-800/80 dark:ring-slate-700">
      <IconWorld className="ml-1.5 hidden h-4 w-4 text-slate-400 sm:block" stroke={1.8} />
      
      {(["en", "sw"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-bold uppercase transition-all",
            lang === l 
              ? "bg-white text-cf-primary shadow-sm ring-1 ring-slate-200/50 dark:bg-slate-700 dark:text-white dark:ring-slate-600" 
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

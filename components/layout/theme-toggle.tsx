"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/**
 * Day / night switch wired to next-themes. Renders a stable placeholder until
 * mounted to avoid a hydration mismatch (the server can't know the theme).
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  if (!mounted) {
    return <div className="h-9 w-9 rounded-lg" aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-lg ring-1 transition-colors",
        isDark
          ? "bg-slate-800 ring-slate-700 hover:bg-slate-700 text-amber-300"
          : "bg-white ring-slate-200 hover:bg-slate-50 text-slate-500",
      )}
    >
      {/* Sun (light) */}
      <IconSun
        stroke={2}
        className={cn(
          "absolute h-[18px] w-[18px] transition-all duration-300",
          isDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
        )}
      />
      {/* Moon (dark) */}
      <IconMoon
        stroke={2}
        className={cn(
          "absolute h-[18px] w-[18px] transition-all duration-300",
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0",
        )}
      />
    </button>
  );
}

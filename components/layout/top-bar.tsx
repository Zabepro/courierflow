"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { IconTruck } from "@tabler/icons-react";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { MobileNav } from "./mobile-nav";
import { useLanguage } from "@/lib/i18n/context";

export function TopBar({ role }: { role: string }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);
  
  // Use translation mapping
  const TITLES: Record<string, string> = {
    "/dashboard":             t.nav.overview,
    "/dashboard/deliveries":  t.nav.deliveries,
    "/dashboard/drivers":     t.nav.drivers,
    "/dashboard/map":         t.nav.fleetMap,
    "/dashboard/reports":     t.nav.reports,
    "/dashboard/driver":      t.nav.driverPortal,
    "/dashboard/settings":    t.nav.settings,
  };

  const title = TITLES[pathname] ?? t.topbar.titleFallback;

  return (
    <header suppressHydrationWarning className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-6">
      {/* Mobile: show logo (sidebar is hidden); Desktop: show page title */}
      <div className="flex items-center gap-2">
        <MobileNav role={role} />
        <Link
          href="/dashboard"
          className="flex items-center gap-2 lg:hidden"
        >
          <IconTruck className="h-5 w-5 text-cf-primary" stroke={1.8} />
          <span className="font-heading font-bold text-cf-primary">CourierFlow</span>
        </Link>
        <h1 className="hidden font-heading text-lg font-semibold text-slate-800 lg:block">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <LanguageToggle />
        <ThemeToggle />
        {mounted ? <UserButton /> : <div className="h-7 w-7 rounded-full bg-slate-200" aria-hidden="true" />}
      </div>
    </header>
  );
}

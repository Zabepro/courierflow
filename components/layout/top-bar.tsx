"use client";

import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { IconTruck } from "@tabler/icons-react";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";

const TITLES: Record<string, string> = {
  "/dashboard":             "Overview",
  "/dashboard/deliveries":  "Deliveries",
  "/dashboard/drivers":     "Drivers",
  "/dashboard/map":         "Fleet Map",
  "/dashboard/reports":     "Reports",
  "/dashboard/driver":      "Driver Portal",
  "/dashboard/settings":    "Settings",
};

export function TopBar() {
  const pathname = usePathname();
  const title    = TITLES[pathname] ?? "Dashboard";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-6">
      {/* Mobile: show logo (sidebar is hidden); Desktop: show page title */}
      <div className="flex items-center gap-2">
        <MobileNav />
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
        <ThemeToggle />
        <UserButton />
      </div>
    </header>
  );
}

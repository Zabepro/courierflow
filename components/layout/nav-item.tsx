"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavEntry } from "./nav-config";

export function NavItem({
  href, label, icon: Icon, exact, onNavigate,
}: NavEntry & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active   = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-cf-primary text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" stroke={active ? 2 : 1.8} />
      {label}
    </Link>
  );
}

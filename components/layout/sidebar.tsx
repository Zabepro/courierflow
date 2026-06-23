"use client";

import { IconTruck } from "@tabler/icons-react";
import { NAV, PORTAL_NAV, BOTTOM_NAV } from "./nav-config";
import { NavItem } from "./nav-item";

export function Sidebar() {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b px-5">
        <IconTruck className="h-5 w-5 text-cf-primary" stroke={1.8} />
        <span className="font-heading text-lg font-bold text-cf-primary tracking-tight">
          CourierFlow
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 pt-4 space-y-4">
        <div className="space-y-0.5">
          {NAV.map((item) => <NavItem key={item.href} {...item} />)}
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-1.5">
            Portals
          </p>
          <div className="space-y-0.5">
            {PORTAL_NAV.map((item) => <NavItem key={item.href} {...item} />)}
          </div>
        </div>
      </nav>

      {/* Label */}
      <div className="px-4 pb-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          System
        </p>
      </div>

      {/* Bottom nav */}
      <div className="space-y-0.5 p-3 pb-4">
        {BOTTOM_NAV.map((item) => <NavItem key={item.href} {...item} />)}
      </div>
    </aside>
  );
}

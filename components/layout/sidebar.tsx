"use client";

import { IconTruck } from "@tabler/icons-react";
import { navForRole } from "./nav-config";
import { NavItem } from "./nav-item";
import { useLanguage } from "@/lib/i18n/context";

export function Sidebar({ role }: { role: string }) {
  const { t } = useLanguage();
  const { main, bottom } = navForRole(role, t);

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
        {main.map((section, i) => (
          <div key={section.label ?? i}>
            {section.label && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-1.5">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => <NavItem key={item.href} {...item} />)}
            </div>
          </div>
        ))}
      </nav>

      {bottom.length > 0 && (
        <>
          {/* Label */}
          <div className="px-4 pb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {t.nav.system}
            </p>
          </div>

          {/* Bottom nav */}
          <div className="space-y-0.5 p-3 pb-4">
            {bottom.map((item) => <NavItem key={item.href} {...item} />)}
          </div>
        </>
      )}
    </aside>
  );
}

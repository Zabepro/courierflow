"use client";

import { useState, useEffect } from "react";
import { IconMenu2, IconX, IconTruck } from "@tabler/icons-react";
import { navForRole } from "./nav-config";
import { NavItem } from "./nav-item";
import { cn } from "@/lib/utils";

export function MobileNav({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const { main, bottom } = navForRole(role);

  /* Close on Escape + lock body scroll while the drawer is open */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      {/* Hamburger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
      >
        <IconMenu2 className="h-5 w-5" stroke={1.8} />
      </button>

      {/* Overlay */}
      <div
        onClick={close}
        aria-hidden
        className={cn(
          "fixed inset-0 z-[2500] bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-y-0 left-0 z-[2600] flex w-72 max-w-[82%] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b px-5">
          <div className="flex items-center gap-2.5">
            <IconTruck className="h-5 w-5 text-cf-primary" stroke={1.8} />
            <span className="font-heading text-lg font-bold tracking-tight text-cf-primary">CourierFlow</span>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <IconX className="h-5 w-5" stroke={1.8} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-4 overflow-y-auto p-3 pt-4">
          {main.map((section, i) => (
            <div key={section.label ?? i}>
              {section.label && (
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">{section.label}</p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => <NavItem key={item.href} {...item} onNavigate={close} />)}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        {bottom.length > 0 && (
          <div className="space-y-0.5 border-t p-3">
            {bottom.map((item) => <NavItem key={item.href} {...item} onNavigate={close} />)}
          </div>
        )}
      </div>
    </div>
  );
}

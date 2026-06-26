"use client";

import { useEffect, useState } from "react";
import { IconDownload, IconX, IconTruck } from "@tabler/icons-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "cf:pwa:dismissed";

/**
 * Registers the service worker and shows a tasteful, dismissible "Install app"
 * banner when the browser reports the app is installable. Mounted once in the
 * root layout; renders nothing until installable.
 */
export function PwaRegister() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  /* Register the service worker (production only). */
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    const onLoad = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  /* Capture the install prompt + decide whether to show the banner. */
  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return; // already installed
    if (localStorage.getItem(DISMISS_KEY)) return; // user said no

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setVisible(false));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* storage off */ }
  }

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[3000] p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 shadow-2xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cf-primary">
          <IconTruck className="h-5 w-5 text-white" stroke={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white leading-tight">Install CourierFlow</p>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
            Faster access &amp; works offline — add it to your home screen.
          </p>
        </div>
        <button
          onClick={install}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-cf-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-cf-primary/90"
        >
          <IconDownload className="h-3.5 w-3.5" stroke={2.5} />
          Install
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex shrink-0 items-center justify-center rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

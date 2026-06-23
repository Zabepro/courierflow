import Link from "next/link";
import { IconTruck, IconArrowLeft } from "@tabler/icons-react";

export function LegalShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a1417] text-white">
      {/* Nav */}
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cf-primary shadow-lg shadow-cf-primary/30">
              <IconTruck className="h-5 w-5 text-white" stroke={1.8} />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight">CourierFlow</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white/70 ring-1 ring-white/15 transition-colors hover:bg-white/10 hover:text-white"
          >
            <IconArrowLeft className="h-4 w-4" stroke={2} />
            Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-white/45">Last updated: {lastUpdated}</p>

        <div className="mt-10 [&_a]:text-cf-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_li]:mt-1.5 [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-white/60 [&_p]:mt-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-white/60 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>

        {/* Disclaimer */}
        <div className="mt-12 rounded-xl bg-amber-500/10 px-5 py-4 ring-1 ring-amber-500/20">
          <p className="text-xs leading-relaxed text-amber-200/80">
            This document is a starting template, not legal advice. Have it reviewed by a
            qualified lawyer in your jurisdiction before relying on it commercially.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-4 text-sm">
            <Link href="/privacy" className="text-white/50 transition-colors hover:text-white">Privacy</Link>
            <Link href="/terms" className="text-white/50 transition-colors hover:text-white">Terms</Link>
          </div>
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} CourierFlow · Tanzania
          </p>
        </div>
      </footer>
    </div>
  );
}

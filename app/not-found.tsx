import Link from "next/link";
import { IconTruck, IconArrowLeft, IconRoute } from "@tabler/icons-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a1417] text-white">
      {/* Top brand */}
      <header className="border-b border-white/5">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cf-primary shadow-lg shadow-cf-primary/30">
              <IconTruck className="h-5 w-5 text-white" stroke={1.8} />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight">CourierFlow</span>
          </Link>
        </div>
      </header>

      {/* Center */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-20">
        <div className="absolute -top-24 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-cf-primary/20 blur-[120px]" />

        <div className="text-center">
          <p className="font-heading text-7xl font-bold tracking-tight text-white sm:text-8xl">404</p>
          <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight">This route doesn&apos;t exist</h1>
          <p className="mx-auto mt-3 max-w-sm text-white/55">
            The page you&apos;re looking for may have been moved, or the link is incorrect.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-cf-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cf-primary/30 transition-colors hover:bg-cf-primary/90"
            >
              <IconArrowLeft className="h-4 w-4" stroke={2.2} />
              Back to home
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/15 transition-colors hover:bg-white/10"
            >
              <IconRoute className="h-4 w-4" stroke={2} />
              Go to dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

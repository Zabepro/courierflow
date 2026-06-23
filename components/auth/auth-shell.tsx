import Link from "next/link";
import { IconTruck, IconCheck } from "@tabler/icons-react";

/* Shared Clerk styling — teal brand accent + the card lifted off the dark
   panel with a shadow and hairline ring so it doesn't read as flat. */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#0b5d5e",
    borderRadius: "0.7rem",
  },
  elements: {
    card: "shadow-2xl shadow-black/50 ring-1 ring-white/10",
    cardBox: "shadow-2xl shadow-black/50",
  },
} as const;

const BULLETS = [
  "Live parcel tracking, end to end",
  "M-Pesa, Tigo Pesa & Airtel Money",
  "Photo & GPS proof of delivery",
];

export function AuthShell({
  title = "Run your deliveries like clockwork.",
  subtitle = "Everything you need to dispatch, track and get paid — built for couriers across Tanzania.",
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#0a1417]">
      {/* ── Left branded panel (desktop only) ── */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block xl:w-[55%]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(11,93,94,0.92) 0%, rgba(8,33,40,0.94) 55%, rgba(10,20,23,0.96) 100%), url('/hero-delivery.jpg') center/cover no-repeat",
          }}
        />
        <div className="absolute -bottom-24 -left-20 h-96 w-96 rounded-full bg-cf-accent/20 blur-[120px]" />
        <div className="absolute -top-20 right-0 h-80 w-80 rounded-full bg-cf-primary/30 blur-[120px]" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Link href="/" className="cf-fade-up inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
              <IconTruck className="h-5 w-5 text-white" stroke={1.8} />
            </div>
            <span className="font-heading text-xl font-bold text-white">CourierFlow</span>
          </Link>

          <div className="max-w-md">
            <h2 className="cf-fade-up font-heading text-3xl font-bold leading-tight text-white xl:text-4xl" style={{ animationDelay: "150ms" }}>{title}</h2>
            <p className="cf-fade-up mt-4 text-white/70" style={{ animationDelay: "300ms" }}>{subtitle}</p>
            <ul className="mt-8 space-y-3">
              {BULLETS.map((b, i) => (
                <li
                  key={b}
                  className="cf-fade-up flex items-center gap-3 text-sm font-medium text-white/85"
                  style={{ animationDelay: `${450 + i * 140}ms` }}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                    <IconCheck className="h-3.5 w-3.5 text-cf-warning" stroke={3} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <p className="cf-fade-up text-xs text-white/40" style={{ animationDelay: "900ms" }}>
            © {new Date().getFullYear()} CourierFlow · Delivery management for Tanzania
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="relative flex w-full flex-col bg-gradient-to-b from-[#0d1c20] to-[#070f11] lg:w-1/2 xl:w-[45%]">
        <div className="pointer-events-none absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-cf-primary/20 blur-[130px]" />

        {/* Brand on mobile (left panel hidden) */}
        <div className="flex items-center justify-center gap-2.5 px-6 pt-10 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cf-primary">
            <IconTruck className="h-5 w-5 text-white" stroke={1.8} />
          </div>
          <span className="font-heading text-lg font-bold text-white">CourierFlow</span>
        </div>

        <div className="cf-fade-in relative z-10 flex flex-1 items-center justify-center px-6 py-10" style={{ animationDelay: "150ms" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

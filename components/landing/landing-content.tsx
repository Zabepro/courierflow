"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconTruck, IconArrowRight, IconRoute, IconDeviceMobile,
  IconMap2, IconClipboardCheck, IconBolt, IconShieldCheck,
  IconCheck, IconPackageExport, IconUsersGroup, IconCash,
  IconChevronDown, IconStarFilled, IconBrandWhatsapp,
  IconLayoutDashboard, IconPackage, IconUsers, IconQuote, IconWorld,
} from "@tabler/icons-react";
import { TrackWidget } from "@/components/landing/track-widget";
import { cn } from "@/lib/utils";
import {
  translations, type Lang, WHATSAPP_URL,
  TESTIMONIAL_NAMES, TESTIMONIAL_INITIALS,
} from "./translations";

const PAY_METHODS = ["M-Pesa", "Tigo Pesa", "Airtel Money", "AzamPay"];

const FEATURE_ICONS = [IconRoute, IconDeviceMobile, IconMap2, IconClipboardCheck];
const STEP_ICONS    = [IconPackageExport, IconUsersGroup, IconCash];
const PREVIEW_NAV_ICONS = [IconLayoutDashboard, IconPackage, IconUsers, IconMap2];
const PREVIEW_STAT_COLORS = ["text-cf-primary", "text-orange-500", "text-amber-500", "text-emerald-600"];
const PREVIEW_ROW_STYLE = [
  { dot: "bg-orange-500", pill: "bg-orange-50 text-orange-600" },
  { dot: "bg-green-500",  pill: "bg-green-50 text-green-600" },
  { dot: "bg-slate-400",  pill: "bg-slate-100 text-slate-500" },
];

/* Headline word that cycles through a list with a fade/flip-up animation.
   Re-keying on the index replays the CSS animation on every change; resets
   when the word list changes (e.g. on language switch). */
function RotatingWord({ words, className }: { words: string[]; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    const id = setInterval(() => setI((p) => (p + 1) % words.length), 2600);
    return () => clearInterval(id);
  }, [words]);
  return (
    <span key={i} className={cn("cf-rotate-word", className)}>
      {words[i]}
    </span>
  );
}

export function LandingContent() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("cf-lang");
    if (saved === "sw" || saved === "en") setLang(saved);
  }, []);

  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("cf-lang", l);
    document.documentElement.lang = l;
  };

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const t = translations[lang];

  return (
    <div className="min-h-screen bg-[#0a1417] text-white">
      {/* ───────────── Fixed site header (always visible) ───────────── */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
          scrolled ? "border-b border-white/10 bg-[#0a1417]/85 backdrop-blur-md" : "bg-transparent",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5">
          <a href="#top" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cf-primary shadow-lg shadow-cf-primary/30">
              <IconTruck className="h-5 w-5 text-white" stroke={1.8} />
            </div>
            <span className="font-heading text-base font-bold tracking-tight sm:text-lg">CourierFlow</span>
          </a>

          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#pricing" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-white/70 transition-colors hover:text-white sm:block">{t.nav.pricing}</a>
            <a href="#faq" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-white/70 transition-colors hover:text-white sm:block">{t.nav.faq}</a>

            {/* Language toggle — always reachable */}
            <div className="flex items-center gap-0.5 rounded-lg bg-white/5 p-1 ring-1 ring-white/15">
              <IconWorld className="ml-1 hidden h-4 w-4 text-white/50 sm:block" stroke={2} />
              {(["en", "sw"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => changeLang(l)}
                  aria-pressed={lang === l}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-bold uppercase transition-colors",
                    lang === l ? "bg-white text-cf-primary" : "text-white/60 hover:text-white",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>

            <Link
              href="/sign-in"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white/80 ring-1 ring-white/15 transition-colors hover:bg-white/10 hover:text-white sm:px-4"
            >
              {t.nav.signIn}
            </Link>
          </nav>
        </div>
      </header>

      {/* ───────────────────────── Hero ───────────────────────── */}
      <span id="top" className="absolute top-0" aria-hidden />
      <section className="relative isolate overflow-hidden bg-[#0a1417]">
        {/* Optimized, responsive background — served as AVIF/WebP at the right
            size for each device (sharp on phones, light to download) instead of
            a single heavy fixed-resolution JPG. */}
        <Image
          src="/hero-delivery.jpg"
          alt=""
          fill
          priority
          quality={90}
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: `
              linear-gradient(to right, rgba(8,18,21,0.94) 0%, rgba(8,18,21,0.80) 42%, rgba(8,18,21,0.45) 100%),
              linear-gradient(to bottom, rgba(8,18,21,0.25) 0%, rgba(8,18,21,0.30) 55%, rgba(10,20,23,1) 100%)
            `,
          }}
        />
        <div className="absolute -top-32 -left-24 -z-10 h-96 w-96 rounded-full bg-cf-primary/30 blur-[120px]" />
        <div className="absolute top-20 right-0 -z-10 h-80 w-80 rounded-full bg-cf-accent/20 blur-[120px]" />

        {/* Hero content */}
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-28 sm:pt-36">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/15 backdrop-blur-sm">
              <IconBolt className="h-3.5 w-3.5 text-cf-warning" stroke={2.5} />
              {t.hero.badge}
            </div>

            <h1 className="font-heading text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
              {t.hero.titlePre}{" "}
              <RotatingWord words={t.hero.rotateWords} className="text-cf-warning" />
              <br />
              {t.hero.titlePost}
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">{t.hero.subtitle}</p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 rounded-xl bg-cf-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cf-primary/30 transition-all hover:bg-cf-primary/90 active:scale-[0.98]"
              >
                {t.hero.ctaPrimary}
                <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" stroke={2.2} />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-6 py-3.5 text-sm font-bold text-white ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                {t.hero.ctaSecondary}
              </Link>
            </div>

            <div className="mt-10">
              <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/50">
                <IconRoute className="h-3.5 w-3.5" stroke={2} />
                {t.hero.trackLabel}
              </p>
              <TrackWidget placeholder={t.hero.trackPlaceholder} buttonLabel={t.hero.trackButton} />
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs text-white/50">
              <IconShieldCheck className="h-4 w-4 text-cf-success" stroke={2} />
              {t.hero.trust}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── Stats + payment band ───────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {t.stats.map((s) => (
              <div key={s.label} className="text-center sm:text-left">
                <p className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-sm text-white/50">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/5 pt-8 sm:flex-row sm:justify-between">
            <p className="text-sm font-semibold text-white/60">{t.payBand}</p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {PAY_METHODS.map((m) => (
                <span key={m} className="rounded-lg bg-white/5 px-3.5 py-1.5 text-sm font-bold text-white/80 ring-1 ring-white/10">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── Product preview ───────────────────── */}
      <section className="border-t border-white/5 bg-[#0a1417]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-cf-warning">{t.preview.eyebrow}</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight">{t.preview.title}</h2>
            <p className="mx-auto mt-3 max-w-lg text-white/55">{t.preview.subtitle}</p>
          </div>

          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-white/10">
            <div className="flex items-center gap-2 bg-[#0d1b1f] px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-400/80" />
              <span className="h-3 w-3 rounded-full bg-amber-400/80" />
              <span className="h-3 w-3 rounded-full bg-green-400/80" />
              <div className="ml-3 flex-1">
                <div className="mx-auto w-fit rounded-md bg-white/5 px-3 py-1 text-[11px] text-white/40">app.courierflow.co.tz/dashboard</div>
              </div>
            </div>

            <div className="flex bg-slate-50">
              <aside className="hidden w-44 shrink-0 flex-col gap-1 border-r border-slate-200 bg-white p-3 sm:flex">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cf-primary">
                    <IconTruck className="h-3.5 w-3.5 text-white" stroke={1.8} />
                  </div>
                  <span className="font-heading text-sm font-bold text-cf-primary">CourierFlow</span>
                </div>
                {t.preview.nav.map((label, i) => {
                  const Icon = PREVIEW_NAV_ICONS[i];
                  return (
                    <div key={label} className={cn("flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium", i === 0 ? "bg-cf-primary text-white" : "text-slate-500")}>
                      <Icon className="h-3.5 w-3.5" stroke={1.8} /> {label}
                    </div>
                  );
                })}
              </aside>

              <div className="min-w-0 flex-1 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-heading text-sm font-bold text-slate-800">{t.preview.nav[0]}</p>
                    <p className="text-[10px] text-slate-400">{t.preview.tableTitle}</p>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-cf-primary/20 ring-1 ring-cf-primary/20" />
                </div>

                <div className="mb-3 grid grid-cols-4 gap-2">
                  {t.preview.stats.map((s, i) => (
                    <div key={s.l} className="rounded-lg bg-white p-2.5 ring-1 ring-slate-100">
                      <p className={cn("text-base font-bold tabular-nums", PREVIEW_STAT_COLORS[i])}>{s.n}</p>
                      <p className="text-[9px] text-slate-400">{s.l}</p>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-100">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="text-[10px] font-bold text-slate-600">{t.preview.tableTitle}</p>
                  </div>
                  {t.preview.rows.map((r, i) => (
                    <div key={r.code} className="flex items-center gap-3 border-b border-slate-50 px-3 py-2 last:border-0">
                      <span className="font-mono text-[10px] font-semibold text-cf-primary">{r.code}</span>
                      <span className="flex-1 truncate text-[10px] text-slate-600">{r.who}</span>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold", PREVIEW_ROW_STYLE[i].pill)}>
                        <span className={cn("h-1 w-1 rounded-full", PREVIEW_ROW_STYLE[i].dot)} /> {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Features ───────────────────────── */}
      <section id="features" className="scroll-mt-24 bg-[#0a1417]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 max-w-xl">
            <p className="text-sm font-bold uppercase tracking-widest text-cf-warning">{t.features.eyebrow}</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight">{t.features.title}</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.features.items.map((f, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <div key={f.title} className="group rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/10 transition-all hover:bg-white/[0.06] hover:ring-cf-primary/40">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cf-primary/15 text-cf-primary ring-1 ring-cf-primary/20 transition-colors group-hover:bg-cf-primary group-hover:text-white">
                    <Icon className="h-6 w-6" stroke={1.8} />
                  </div>
                  <h3 className="font-heading text-base font-bold text-white">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/55">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────────────── How it works ───────────────────────── */}
      <section id="how" className="scroll-mt-24 border-t border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-cf-warning">{t.how.eyebrow}</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight">{t.how.title}</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {t.how.steps.map((s, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <div key={s.title} className="relative text-center md:text-left">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cf-primary text-white shadow-lg shadow-cf-primary/20 md:mx-0">
                    <Icon className="h-7 w-7" stroke={1.8} />
                  </div>
                  <div className="mb-2 inline-flex items-center gap-2">
                    <span className="font-heading text-xs font-bold text-cf-warning">STEP {i + 1}</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Testimonials ───────────────────────── */}
      <section className="bg-[#0a1417]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-cf-warning">{t.testimonials.eyebrow}</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight">{t.testimonials.title}</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {t.testimonials.items.map((tm, i) => (
              <figure key={i} className="flex flex-col rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/10">
                <IconQuote className="h-7 w-7 text-cf-primary/40" />
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <IconStarFilled key={s} className="h-3.5 w-3.5 text-cf-warning" />
                  ))}
                </div>
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-white/70">&ldquo;{tm.quote}&rdquo;</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cf-primary text-xs font-bold text-white">{TESTIMONIAL_INITIALS[i]}</div>
                  <div>
                    <p className="text-sm font-bold text-white">{TESTIMONIAL_NAMES[i]}</p>
                    <p className="text-xs text-white/45">{tm.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Pricing ───────────────────────── */}
      <section id="pricing" className="scroll-mt-24 border-t border-white/5 bg-[#0a1417]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-cf-warning">{t.pricing.eyebrow}</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight">{t.pricing.title}</h2>
            <p className="mt-3 text-white/55">{t.pricing.subtitle}</p>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-3">
            {t.pricing.plans.map((p) => {
              const isWa = p.action === "whatsapp";
              const ctaClass = p.highlight
                ? "mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cf-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-cf-primary/90"
                : "mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/15 transition-colors hover:bg-white/10";
              return (
                <div
                  key={p.name}
                  className={p.highlight
                    ? "relative rounded-3xl bg-gradient-to-b from-cf-primary/20 to-white/[0.03] p-8 ring-2 ring-cf-primary"
                    : "rounded-3xl bg-white/[0.03] p-8 ring-1 ring-white/10"}
                >
                  {p.highlight && (
                    <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-cf-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg">
                      <IconStarFilled className="h-3 w-3" /> {t.pricing.popular}
                    </span>
                  )}
                  <h3 className="font-heading text-lg font-bold text-white">{p.name}</h3>
                  <p className="mt-1 text-sm text-white/50">{p.tagline}</p>
                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-heading text-4xl font-bold tracking-tight text-white">{p.price}</span>
                    {p.period && <span className="text-sm font-medium text-white/45">{p.period}</span>}
                  </div>

                  {isWa ? (
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={ctaClass}>{p.cta}</a>
                  ) : (
                    <Link href="/sign-up" className={ctaClass}>{p.cta}</Link>
                  )}

                  <ul className="mt-7 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                        <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-cf-success" stroke={2.5} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="mt-8 text-center text-xs text-white/40">{t.pricing.note}</p>
        </div>
      </section>

      {/* ───────────────────────── FAQ ───────────────────────── */}
      <section id="faq" className="scroll-mt-24 border-t border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="mb-12 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-cf-warning">{t.faq.eyebrow}</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight">{t.faq.title}</h2>
          </div>

          <div className="space-y-3">
            {t.faq.items.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl bg-white/[0.03] px-5 ring-1 ring-white/10 transition-colors open:bg-white/[0.05] open:ring-white/15 [&_summary]:list-none [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-sm font-semibold text-white">
                  {item.q}
                  <IconChevronDown className="h-4 w-4 shrink-0 text-white/50 transition-transform group-open:rotate-180" stroke={2} />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-white/55">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── CTA strip ───────────────────────── */}
      <section className="bg-[#0a1417]">
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-4">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-cf-primary to-[#08323a] p-10 ring-1 ring-white/10 sm:p-12">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-heading text-2xl font-bold tracking-tight">{t.ctaStrip.title}</h3>
                <p className="mt-1.5 text-white/75">{t.ctaStrip.subtitle}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/sign-up" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-cf-primary shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]">
                  {t.ctaStrip.primary}
                  <IconArrowRight className="h-4 w-4" stroke={2.2} />
                </Link>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white/10 px-6 py-3.5 text-sm font-bold text-white ring-1 ring-white/20 transition-colors hover:bg-white/15">
                  <IconBrandWhatsapp className="h-4 w-4" stroke={2} />
                  {t.ctaStrip.whatsapp}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Footer ───────────────────────── */}
      <footer className="border-t border-white/5 bg-[#08110f]">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cf-primary">
                  <IconTruck className="h-4 w-4 text-white" stroke={1.8} />
                </div>
                <span className="font-heading text-base font-bold">CourierFlow</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">{t.footer.brandDesc}</p>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/10">
                <IconBrandWhatsapp className="h-4 w-4 text-cf-success" stroke={2} />
                {t.footer.whatsappChat}
              </a>
            </div>

            {t.footer.columns.map((col) => (
              <div key={col.title}>
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.external ? (
                        <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-sm text-white/60 transition-colors hover:text-white">{l.label}</a>
                      ) : (
                        <Link href={l.href} className="text-sm text-white/60 transition-colors hover:text-white">{l.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 sm:flex-row">
            <p className="text-xs text-white/40">© {new Date().getFullYear()} {t.footer.copyright}</p>
            <p className="text-xs text-white/30">{t.footer.madeIn}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

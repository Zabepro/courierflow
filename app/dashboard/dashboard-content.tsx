"use client";

import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { PageBanner } from "@/components/layout/page-banner";
import { DeliveriesSection } from "./deliveries-section";
import { useLanguage } from "@/lib/i18n/context";

export function DashboardContent() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Page banner */}
      <PageBanner
        image="/banners/overview.jpg"
        title={t.dashboard.bannerTitle}
        subtitle={t.dashboard.bannerSubtitle}
        alt="Aerial view of a logistics distribution centre"
      />

      {/* KPI stats */}
      <StatsCards />

      {/* Deliveries */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold text-slate-800">{t.deliveries.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{t.deliveries.subtitle}</p>
          </div>
          <Link
            href="/dashboard/deliveries"
            className="flex items-center gap-1.5 text-sm font-medium text-cf-primary hover:opacity-75 transition-opacity"
          >
            {t.deliveries.viewAll} <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <DeliveriesSection />
      </div>
    </div>
  );
}

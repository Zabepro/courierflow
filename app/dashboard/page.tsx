import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { PageBanner } from "@/components/layout/page-banner";
import { DeliveriesSection } from "./deliveries-section";
import { requireAdminPage } from "@/lib/auth/server";

export default async function DashboardPage() {
  await requireAdminPage();
  return (
    <div className="space-y-6">
      {/* Page banner */}
      <PageBanner
        image="/banners/overview.jpg"
        title="Overview"
        subtitle="Your delivery operation at a glance — deliveries, drivers and revenue."
        alt="Aerial view of a logistics distribution centre"
      />

      {/* KPI stats */}
      <StatsCards />

      {/* Deliveries */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold text-slate-800">Deliveries</h2>
            <p className="text-sm text-slate-500 mt-0.5">Manage and track all your deliveries</p>
          </div>
          <Link
            href="/dashboard/deliveries"
            className="flex items-center gap-1.5 text-sm font-medium text-cf-primary hover:opacity-75 transition-opacity"
          >
            View all <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <DeliveriesSection />
      </div>
    </div>
  );
}

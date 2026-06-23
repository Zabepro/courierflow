import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DeliveriesSection } from "./deliveries-section";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
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

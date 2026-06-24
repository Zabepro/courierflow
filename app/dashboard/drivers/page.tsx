import { DriversManager } from "@/components/drivers/drivers-manager";
import { PageBanner } from "@/components/layout/page-banner";
import { requireAdminPage } from "@/lib/auth/server";

export default async function DriversPage() {
  await requireAdminPage();
  return (
    <div className="space-y-6">
      <PageBanner
        image="/banners/drivers.jpg"
        title="Drivers"
        subtitle="Manage your delivery team and track their workload"
        alt="Row of delivery scooters parked on a city street"
      />
      <DriversManager />
    </div>
  );
}

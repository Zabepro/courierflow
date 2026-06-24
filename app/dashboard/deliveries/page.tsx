import { DeliveriesSection } from "@/app/dashboard/deliveries-section";
import { PageBanner } from "@/components/layout/page-banner";
import { requireAdminPage } from "@/lib/auth/server";

export default async function DeliveriesPage() {
  await requireAdminPage();
  return (
    <div className="space-y-6">
      <PageBanner
        image="/banners/deliveries.jpg"
        title="Deliveries"
        subtitle="Create, manage and track all deliveries"
        alt="Warehouse shelves of parcels ready for dispatch"
      />
      <DeliveriesSection />
    </div>
  );
}

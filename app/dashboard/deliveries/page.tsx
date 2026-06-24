import { DeliveriesSection } from "@/app/dashboard/deliveries-section";
import { TranslatedBanner } from "@/components/layout/translated-banner";
import { requireAdminPage } from "@/lib/auth/server";

export default async function DeliveriesPage() {
  await requireAdminPage();
  return (
    <div className="space-y-6">
      <TranslatedBanner
        pageKey="deliveries"
        image="/banners/deliveries.jpg"
        alt="Warehouse shelves of parcels ready for dispatch"
      />
      <DeliveriesSection />
    </div>
  );
}

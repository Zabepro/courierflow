import { DriversManager } from "@/components/drivers/drivers-manager";
import { TranslatedBanner } from "@/components/layout/translated-banner";
import { requireAdminPage } from "@/lib/auth/server";

export default async function DriversPage() {
  await requireAdminPage();
  return (
    <div className="space-y-6">
      <TranslatedBanner
        pageKey="drivers"
        image="/banners/drivers.jpg"
        alt="Row of delivery scooters parked on a city street"
      />
      <DriversManager />
    </div>
  );
}

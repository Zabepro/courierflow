import { DashboardContent } from "./dashboard-content";
import { requireAdminPage } from "@/lib/auth/server";

export default async function DashboardPage() {
  await requireAdminPage();
  return <DashboardContent />;
}

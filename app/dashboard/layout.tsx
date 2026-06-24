import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { getSessionUser } from "@/lib/auth/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const me = await getSessionUser();
  // Fall back to the most restrictive nav if the record isn't ready yet.
  const role = me?.role ?? "DRIVER";

  return (
    <div className="cf-dashboard flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar — hidden on small screens */}
      <div className="hidden lg:flex">
        <Sidebar role={role} />
      </div>

      {/* Right column: top bar + scrollable content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar role={role} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

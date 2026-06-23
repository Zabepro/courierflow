import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="cf-dashboard flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar — hidden on small screens */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Right column: top bar + scrollable content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

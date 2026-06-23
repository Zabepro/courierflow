import { DriversManager } from "@/components/drivers/drivers-manager";

export default function DriversPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-xl font-semibold text-slate-800">Drivers</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your delivery team and track their workload
        </p>
      </div>
      <DriversManager />
    </div>
  );
}

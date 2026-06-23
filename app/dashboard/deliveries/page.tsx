import { DeliveriesSection } from "@/app/dashboard/deliveries-section";

export default function DeliveriesPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-heading text-xl font-semibold text-slate-800">Deliveries</h2>
        <p className="text-sm text-slate-500 mt-1">Create, manage and track all deliveries</p>
      </div>
      <DeliveriesSection />
    </div>
  );
}

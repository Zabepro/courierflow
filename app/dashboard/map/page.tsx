import { FleetMap } from "@/components/map/fleet-map";

export default function FleetMapPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shrink-0">
        <div>
          <h2 className="font-heading text-xl font-semibold text-slate-800">Fleet Map</h2>
          <p className="text-sm text-slate-500 mt-0.5">Live locations of active deliveries</p>
        </div>
      </div>

      {/* Map fills remaining space */}
      <div className="flex-1 min-h-0">
        <FleetMap />
      </div>
    </div>
  );
}

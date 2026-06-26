"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { IconUser, IconLoader2 } from "@tabler/icons-react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge }  from "@/components/ui/badge";
import type { ApiDelivery, ApiDriver } from "./types";

interface Props {
  delivery: ApiDelivery | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAssigned: (d: ApiDelivery) => void;
}

export function AssignDriverDialog({ delivery, open, onOpenChange, onAssigned }: Props) {
  const [drivers,    setDrivers]    = useState<ApiDriver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch drivers whenever dialog opens
  useEffect(() => {
    if (!open) return;
    setSelectedId(delivery?.driverId ?? "");
    setLoadingDrivers(true);
    fetch("/api/drivers")
      .then((r) => r.json())
      .then((data: ApiDriver[]) => setDrivers(data))
      .catch(() => toast.error("Failed to load drivers"))
      .finally(() => setLoadingDrivers(false));
  }, [open, delivery?.driverId]);

  const handleAssign = async () => {
    if (!delivery || !selectedId) return;
    setSubmitting(true);
    try {
      const res  = await fetch(`/api/deliveries/${delivery.id}/assign`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ driverId: selectedId }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Assignment failed");
        return;
      }

      onAssigned(data as ApiDelivery);
      onOpenChange(false);

      const driver = drivers.find((d) => d.id === selectedId);
      if (data.alreadyAssigned) {
        toast.info(`Already assigned to ${driver?.name ?? "this driver"}`);
      } else {
        toast.success(`Assigned to ${driver?.name ?? "driver"} — SMS sent`);
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  const currentDriver = delivery?.driver;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Assign Driver</DialogTitle>
          <DialogDescription>
            {delivery?.trackingCode} · {delivery?.recipientName}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {currentDriver && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <IconUser className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Currently:</span>
              <span className="font-medium">{currentDriver.name ?? "—"}</span>
            </div>
          )}

          {loadingDrivers ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
              <IconLoader2 className="h-4 w-4 animate-spin" />
              Loading drivers...
            </div>
          ) : drivers.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              No drivers found in your organization.
              <br />
              <span className="text-xs">Add drivers via the dev setup to test this feature.</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Select driver</p>
              <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
                {drivers
                  .sort((a, b) => {
                    if (a.isOnline === b.isOnline) return a.activeDeliveries - b.activeDeliveries;
                    return a.isOnline ? -1 : 1;
                  })
                  .map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedId(d.id)}
                    className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors text-left ${
                      selectedId === d.id
                        ? "border-cf-primary bg-cf-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full border border-white shadow-sm ${d.isOnline ? "bg-emerald-500" : "bg-slate-300"}`} title={d.isOnline ? "Online" : "Offline"} />
                      <div>
                        <p className="font-medium leading-tight">{d.name ?? "Unnamed"}</p>
                        {d.phone && <p className="text-xs text-muted-foreground">{d.phone}</p>}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        d.activeDeliveries === 0
                          ? "text-green-700 border-green-200 bg-green-50"
                          : d.activeDeliveries >= 5
                          ? "text-red-700 border-red-200 bg-red-50"
                          : "text-amber-700 border-amber-200 bg-amber-50"
                      }
                    >
                      {d.activeDeliveries} active
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedId || submitting || loadingDrivers}
            className="bg-cf-primary hover:bg-cf-primary/90 text-white"
          >
            {submitting ? "Assigning..." : "Assign Driver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

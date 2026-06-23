"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconAlertTriangle, IconTrash } from "@tabler/icons-react";

export function DangerZone({ orgName }: { orgName: string }) {
  const [open, setOpen]       = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const match = confirm.trim().toLowerCase() === orgName.trim().toLowerCase();

  async function handleReset() {
    if (!match || loading) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/organization/reset", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ confirm: confirm.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((data as { error?: string }).error ?? "Reset failed");
        return;
      }
      const d = (data as { deleted?: Record<string, number> }).deleted ?? {};
      toast.success(`Cleared ${d.deliveries ?? 0} deliveries & ${d.drivers ?? 0} drivers. Refreshing…`);
      setTimeout(() => window.location.reload(), 1400);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-red-500/[0.04] ring-1 ring-red-500/30">
      <div className="flex items-center gap-2.5 border-b border-red-500/15 px-5 py-4 sm:px-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
          <IconAlertTriangle className="h-5 w-5" stroke={2} />
        </div>
        <div>
          <h3 className="font-heading text-base font-bold text-red-700">Danger Zone</h3>
          <p className="text-xs text-red-600/70">Irreversible — proceed with care</p>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <p className="text-sm leading-relaxed text-slate-600">
          Permanently delete <strong className="text-slate-700">all deliveries, drivers, payments,
          GPS tracking, proof of delivery and SMS logs</strong> for this organisation. Your account
          and organisation stay — only the operational data is cleared so you can start fresh.
        </p>

        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
          >
            <IconTrash className="h-4 w-4" stroke={2} />
            Reset all data
          </button>
        ) : (
          <div className="mt-4 space-y-3 rounded-xl p-4 ring-1 ring-red-300/50">
            <p className="text-sm font-medium text-slate-700">
              Type{" "}
              <span className="rounded bg-red-500/15 px-1.5 py-0.5 font-mono text-red-700">{orgName}</span>{" "}
              to confirm:
            </p>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={orgName}
              autoFocus
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-red-400 focus:ring-2 focus:ring-red-200"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setOpen(false); setConfirm(""); }}
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={!match || loading}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Deleting…" : <><IconTrash className="h-4 w-4" stroke={2} /> Delete everything</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

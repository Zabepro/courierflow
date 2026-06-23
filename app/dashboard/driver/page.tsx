import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import {
  IconTruck, IconMapPin, IconPackage, IconChevronRight,
  IconClockHour4, IconRoute, IconCircleCheck, IconBolt,
} from "@tabler/icons-react";

const STATUS_LABEL: Record<string, { label: string; cls: string; dot: string }> = {
  ASSIGNED:   { label: "Assigned",   cls: "bg-blue-50   text-blue-700   ring-1 ring-blue-200",   dot: "bg-blue-500"   },
  PICKED_UP:  { label: "Picked Up",  cls: "bg-amber-50  text-amber-700  ring-1 ring-amber-200",  dot: "bg-amber-400"  },
  IN_TRANSIT: { label: "In Transit", cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-200", dot: "bg-orange-500" },
};

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  URGENT: { label: "Urgent", cls: "bg-red-50 text-red-600 ring-1 ring-red-200" },
  HIGH:   { label: "High",   cls: "bg-orange-50 text-orange-600 ring-1 ring-orange-200" },
};

function StatPill({
  icon: Icon, value, label, tint,
}: {
  icon: typeof IconPackage;
  value: number;
  label: string;
  tint: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-3.5 ring-1 ring-slate-100 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        <Icon className="h-5 w-5" stroke={2} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none tabular-nums text-slate-800">{value}</p>
        <p className="mt-1 text-[11px] font-medium text-slate-400 truncate">{label}</p>
      </div>
    </div>
  );
}

export default async function DriverHomePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true, name: true, role: true, organizationId: true },
  });
  if (!user || !user.organizationId) redirect("/sign-in");

  const isDriver = user.role === "DRIVER";

  /* DRIVERs see only their own deliveries; ADMINs see all active org deliveries */
  const deliveries = await prisma.delivery.findMany({
    where: {
      ...(isDriver ? { driverId: user.id } : { organizationId: user.organizationId! }),
      status: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: {
      id: true, trackingCode: true, status: true, priority: true,
      deliveryAddress: true, recipientName: true, city: true,
      driver: { select: { name: true } },
    },
  });

  const completedToday = await prisma.delivery.count({
    where: {
      ...(isDriver ? { driverId: user.id } : { organizationId: user.organizationId! }),
      status:      "DELIVERED",
      deliveredAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });

  const toPickup  = deliveries.filter((d) => d.status === "ASSIGNED").length;
  const onTheRoad = deliveries.filter((d) => d.status === "PICKED_UP" || d.status === "IN_TRANSIT").length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cf-primary shadow-sm shadow-cf-primary/20">
          <IconTruck className="h-6 w-6 text-white" stroke={1.8} />
        </div>
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-bold text-slate-800 truncate">Driver Portal</h1>
          <p className="text-sm text-slate-500 truncate">
            {user.name ? `Welcome back, ${user.name}` : "Your active deliveries"}
          </p>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill icon={IconClockHour4}  value={toPickup}      label="To pick up"     tint="bg-blue-50 text-blue-600" />
        <StatPill icon={IconRoute}       value={onTheRoad}     label="On the road"    tint="bg-orange-50 text-orange-500" />
        <StatPill icon={IconCircleCheck} value={completedToday} label="Done today"    tint="bg-emerald-50 text-emerald-600" />
      </div>

      {/* Admin notice */}
      {!isDriver && deliveries.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <IconTruck className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" stroke={2} />
          <p className="text-sm text-blue-700">
            <span className="font-semibold">Admin mode:</span> showing all active org deliveries.
            Open any delivery below to simulate GPS tracking from a driver&apos;s perspective.
          </p>
        </div>
      )}

      {/* Delivery list */}
      {deliveries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <IconPackage className="h-8 w-8 text-slate-400" stroke={1.5} />
          </div>
          <p className="mb-1 font-semibold text-slate-700">No active deliveries</p>
          <p className="max-w-xs text-sm text-slate-400">
            {isDriver
              ? "Your assigned deliveries will appear here."
              : "No deliveries with status Assigned, Picked Up, or In Transit."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Active Deliveries
            </p>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-slate-500">
              {deliveries.length}
            </span>
          </div>

          {deliveries.map((d) => {
            const s    = STATUS_LABEL[d.status];
            const prio = PRIORITY_META[d.priority];
            return (
              <Link
                key={d.id}
                href={`/dashboard/driver/deliveries/${d.id}`}
                className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm transition-all hover:ring-cf-primary/30 hover:shadow-md active:scale-[0.99]"
              >
                {/* Accent bar */}
                <div className={`h-1 ${s?.dot ?? "bg-slate-300"}`} />
                <div className="flex items-stretch gap-3.5 p-4">
                  {/* Left index/avatar */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-xl bg-cf-primary/10">
                    <IconPackage className="h-5 w-5 text-cf-primary" stroke={1.8} />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Top row: code + status */}
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-heading text-sm font-bold text-slate-800">
                        {d.trackingCode}
                      </span>
                      {s && (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      )}
                      {prio && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${prio.cls}`}>
                          <IconBolt className="h-2.5 w-2.5" stroke={2.5} />
                          {prio.label}
                        </span>
                      )}
                    </div>

                    {/* Recipient */}
                    <p className="truncate text-sm font-semibold text-slate-700">{d.recipientName}</p>

                    {/* Address */}
                    <div className="mt-1 flex items-center gap-1">
                      <IconMapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" stroke={1.8} />
                      <p className="truncate text-xs text-slate-400">
                        {d.deliveryAddress}{d.city ? `, ${d.city}` : ""}
                      </p>
                    </div>

                    {!isDriver && d.driver?.name && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <IconTruck className="h-3 w-3" stroke={1.5} />
                        {d.driver.name}
                      </p>
                    )}
                  </div>

                  {/* Chevron */}
                  <div className="flex shrink-0 items-center">
                    <IconChevronRight className="h-5 w-5 text-slate-300 transition-colors group-hover:text-cf-primary" stroke={2} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

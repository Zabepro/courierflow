import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  IconShieldCheck, IconTruck, IconEye,
  IconUsers, IconPackage, IconCalendar,
} from "@tabler/icons-react";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OrgSettingsForm } from "@/components/settings/org-settings-form";
import { PageBanner } from "@/components/layout/page-banner";
import { DangerZone } from "@/components/settings/danger-zone";

const ROLE_META: Record<string, { label: string; icon: React.ElementType; badge: string }> = {
  ADMIN:  { label: "Admin",  icon: IconShieldCheck, badge: "bg-cf-primary/10 text-cf-primary ring-1 ring-cf-primary/20" },
  DRIVER: { label: "Driver", icon: IconTruck,       badge: "bg-orange-50 text-orange-600 ring-1 ring-orange-200" },
  VIEWER: { label: "Viewer", icon: IconEye,         badge: "bg-slate-100 text-slate-500 ring-1 ring-slate-200" },
};

function initials(name: string | null, email: string): string {
  const base = name?.trim() || email;
  return base.split(/\s+/).slice(0, 2).map((w) => (w[0] ?? "").toUpperCase()).join("") || "?";
}

function StatCard({
  label, value, icon: Icon, iconBg, accent,
}: {
  label: string; value: string | number; icon: React.ElementType; iconBg: string; accent: string;
}) {
  return (
    <Card className="relative overflow-hidden bg-white border-0 ring-1 ring-slate-100 shadow-sm p-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-3xl font-bold text-slate-900 tabular-nums leading-none">{value}</p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5 text-white" stroke={1.8} />
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 h-0.5 w-full ${accent}`} />
    </Card>
  );
}

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const me = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true, role: true, organizationId: true },
  });
  if (!me?.organizationId) redirect("/dashboard");

  const org = await prisma.organization.findUnique({
    where:  { id: me.organizationId },
    select: {
      id: true, name: true, phone: true, address: true, city: true, country: true,
      createdAt: true,
      users: {
        select: { id: true, name: true, email: true, role: true },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      },
      _count: { select: { users: true, deliveries: true } },
    },
  });
  if (!org) redirect("/dashboard");

  const canEdit = me.role === "ADMIN";
  const since   = org.createdAt.toLocaleDateString("en-TZ", { month: "short", year: "numeric" });

  return (
    <div className="max-w-4xl space-y-6">
      <PageBanner
        image="/banners/settings.jpg"
        title="Settings"
        subtitle="Manage your organization profile and team"
        alt="Modern office workspace"
      />

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:gap-5 sm:grid-cols-3">
        <StatCard label="Team Members" value={org._count.users}      icon={IconUsers}    iconBg="bg-cf-primary"  accent="bg-cf-primary" />
        <StatCard label="Deliveries"   value={org._count.deliveries} icon={IconPackage}  iconBg="bg-orange-500"  accent="bg-orange-500" />
        <StatCard label="Member Since" value={since}                 icon={IconCalendar} iconBg="bg-slate-500"   accent="bg-slate-400" />
      </div>

      {/* Org profile form */}
      <OrgSettingsForm
        org={{
          name:    org.name,
          phone:   org.phone,
          address: org.address,
          city:    org.city,
          country: org.country,
        }}
        canEdit={canEdit}
      />

      {/* Team members */}
      <Card className="bg-white border-0 ring-1 ring-slate-100 shadow-sm overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-cf-primary via-cf-primary/50 to-transparent" />
        <CardHeader className="pb-5 border-b border-slate-100">
          <CardTitle className="font-heading text-base font-semibold text-slate-800">
            Team Members
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            {org._count.users} {org._count.users === 1 ? "person has" : "people have"} access to this organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {org.users.map((u) => {
              const meta = ROLE_META[u.role] ?? ROLE_META.VIEWER;
              const Icon = meta.icon;
              return (
                <div key={u.id} className="flex items-center gap-4 px-6 py-5 hover:bg-slate-50/60 transition-colors">
                  {/* Avatar */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cf-primary text-sm font-bold text-white select-none shadow-sm">
                    {initials(u.name, u.email)}
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 leading-tight">{u.name ?? "Unnamed"}</p>
                    <p className="truncate text-xs text-slate-400 mt-1">{u.email}</p>
                  </div>
                  {/* Role badge */}
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${meta.badge}`}>
                    <Icon className="h-3.5 w-3.5" stroke={2} />
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Danger zone — admin only */}
      {canEdit && <DangerZone orgName={org.name} />}
    </div>
  );
}

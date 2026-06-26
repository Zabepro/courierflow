"use client";

import {
  IconShieldCheck, IconTruck, IconEye,
  IconUsers, IconPackage, IconCalendar,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OrgSettingsForm, OrgData } from "@/components/settings/org-settings-form";
import { TranslatedBanner } from "@/components/layout/translated-banner";
import { DangerZone } from "@/components/settings/danger-zone";
import { ActivityLog, type AuditRow } from "@/components/settings/activity-log";
import { useLanguage } from "@/lib/i18n/context";

type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

type SettingsViewProps = {
  org: OrgData & { id: string; name: string };
  users: TeamMember[];
  usersCount: number;
  deliveriesCount: number;
  canEdit: boolean;
  since: string;
  auditLogs: AuditRow[];
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

export function SettingsView({ org, users, usersCount, deliveriesCount, canEdit, since, auditLogs }: SettingsViewProps) {
  const { t } = useLanguage();
  const s = t.settings;

  const ROLE_META: Record<string, { label: string; icon: React.ElementType; badge: string }> = {
    ADMIN:  { label: "Admin",  icon: IconShieldCheck, badge: "bg-cf-primary/10 text-cf-primary ring-1 ring-cf-primary/20" },
    DRIVER: { label: "Driver", icon: IconTruck,       badge: "bg-orange-50 text-orange-600 ring-1 ring-orange-200" },
    VIEWER: { label: "Viewer", icon: IconEye,         badge: "bg-slate-100 text-slate-500 ring-1 ring-slate-200" },
  };

  return (
    <div className="max-w-4xl space-y-6">
      <TranslatedBanner
        pageKey="settings"
        image="/banners/settings.jpg"
        alt="Modern office workspace"
      />

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:gap-5 sm:grid-cols-3">
        <StatCard label={s.teamMembers} value={usersCount}      icon={IconUsers}    iconBg="bg-cf-primary"  accent="bg-cf-primary" />
        <StatCard label={s.deliveries}  value={deliveriesCount} icon={IconPackage}  iconBg="bg-orange-500"  accent="bg-orange-500" />
        <StatCard label={s.memberSince} value={since}           icon={IconCalendar} iconBg="bg-slate-500"   accent="bg-slate-400" />
      </div>

      {/* Org profile form */}
      <OrgSettingsForm
        org={org}
        canEdit={canEdit}
      />

      {/* Team members */}
      <Card className="bg-white border-0 ring-1 ring-slate-100 shadow-sm overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-cf-primary via-cf-primary/50 to-transparent" />
        <CardHeader className="pb-5 border-b border-slate-100">
          <CardTitle className="font-heading text-base font-semibold text-slate-800">
            {s.teamMembers}
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            {usersCount} {usersCount === 1 ? s.personHasAccess : s.peopleHaveAccess}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {users.map((u) => {
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
                    <p className="truncate text-sm font-semibold text-slate-800 leading-tight">{u.name ?? s.unnamed}</p>
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
      {canEdit && auditLogs.length > 0 && <ActivityLog logs={auditLogs} />}

      {canEdit && <DangerZone orgName={org.name} />}
    </div>
  );
}

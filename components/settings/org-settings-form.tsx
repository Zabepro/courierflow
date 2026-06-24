"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconBuildingStore, IconPhone, IconMapPin,
  IconBuildingSkyscraper, IconWorld, IconDeviceFloppy, IconLock,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

export type OrgData = {
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
};

type FormState   = { name: string; phone: string; address: string; city: string; country: string };
type FieldErrors = Partial<Record<keyof FormState, string[]>>;

const inputBase =
  "w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 " +
  "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cf-primary/30 " +
  "focus:border-cf-primary transition-colors disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";
const inputNormal = "border-slate-200 hover:border-slate-300";
const inputErr    = "border-red-300 focus:ring-red-200 focus:border-red-400";

interface Props {
  org: OrgData;
  canEdit: boolean;
}

export function OrgSettingsForm({ org, canEdit }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name:    org.name,
    phone:   org.phone   ?? "",
    address: org.address ?? "",
    city:    org.city    ?? "",
    country: org.country,
  });
  const [errors, setErrors]     = useState<FieldErrors | null>(null);
  const [submitting, setSubmit] = useState(false);
  const { t } = useLanguage();
  const s = t.settings;

  function set(k: keyof FormState, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors?.[k]) setErrors((e) => (e ? { ...e, [k]: undefined } : null));
  }

  function hasErr(k: keyof FormState) { return !!errors?.[k]?.[0]; }
  function errMsg(k: keyof FormState) {
    return errors?.[k]?.[0]
      ? <p className="mt-1 text-[11px] font-medium text-red-500">{errors[k]![0]}</p>
      : null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setErrors(null);
    setSubmit(true);
    try {
      const res  = await fetch("/api/organization", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 422 && data.details) { setErrors(data.details); return; }
        toast.error(data.error ?? "Failed to save settings");
        return;
      }
      toast.success("Settings saved");
      router.refresh();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSubmit(false);
    }
  }

  const field = (
    key: keyof FormState,
    label: string,
    Icon: React.ElementType,
    placeholder: string,
    type = "text",
  ) => (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
      <div className="relative mt-2">
        <Icon
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
          stroke={1.8}
        />
        <input
          type={type}
          value={form[key]}
          placeholder={placeholder}
          disabled={!canEdit || submitting}
          onChange={(e) => set(key, e.target.value)}
          className={cn(inputBase, hasErr(key) ? inputErr : inputNormal)}
        />
      </div>
      {errMsg(key)}
    </div>
  );

  return (
    <Card className="bg-white border-0 ring-1 ring-slate-100 shadow-sm overflow-hidden">
      <div className="h-[3px] bg-gradient-to-r from-cf-primary via-cf-primary/50 to-transparent" />

      <CardHeader className="pb-5 border-b border-slate-100">
        <CardTitle className="font-heading text-base font-semibold text-slate-800">
          {s.orgProfile}
        </CardTitle>
        <CardDescription className="text-sm mt-1">
          {s.orgProfileDesc}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 pb-6">
        {!canEdit && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3 text-xs text-slate-500">
            <IconLock className="h-4 w-4 shrink-0 text-slate-400" stroke={1.8} />
            {s.adminOnly}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {field("name", s.orgName, IconBuildingStore, "e.g. Dar Express Couriers")}

          <div className="grid gap-5 sm:grid-cols-2">
            {field("phone", s.phone, IconPhone, "+255 7XX XXX XXX", "tel")}
            {field("city",  s.city,  IconBuildingSkyscraper, "Dar es Salaam")}
          </div>

          {field("address", s.address, IconMapPin, "Street, building, area")}
          {field("country", s.country, IconWorld,  "Tanzania")}

          {canEdit && (
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-cf-primary hover:bg-cf-primary/90 text-white h-10 px-6 font-semibold shadow-sm"
              >
                <IconDeviceFloppy className="mr-2 h-4 w-4" stroke={2} />
                {submitting ? s.saving : s.saveChanges}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

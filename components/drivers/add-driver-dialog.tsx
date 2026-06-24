"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  IconUserPlus, IconUser, IconPhone, IconMail, IconArrowRight, IconX,
  IconCopy, IconCircleCheck, IconLink,
} from "@tabler/icons-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";
import type { DriverRow } from "./types";

type FormData = { name: string; phone: string; email: string };
type FieldErrors = Partial<Record<keyof FormData, string[]>>;

const DEFAULT: FormData = { name: "", phone: "+255", email: "" };

const inputBase =
  "w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 " +
  "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cf-primary/30 " +
  "focus:border-cf-primary transition-colors";
const inputNormal = "border-slate-200 hover:border-slate-300";
const inputErr    = "border-red-300 focus:ring-red-200 focus:border-red-400";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (d: DriverRow) => void;
}

export function AddDriverDialog({ open, onOpenChange, onCreated }: Props) {
  const { lang, t } = useLanguage();
  const d = t.drivers.addDialog;

  const [form, setForm]         = useState<FormData>(DEFAULT);
  const [errors, setErrors]     = useState<FieldErrors | null>(null);
  const [submitting, setSubmit] = useState(false);
  const [invite, setInvite]     = useState<{ link: string; name: string } | null>(null);
  const [copied, setCopied]     = useState(false);

  async function copyLink() {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — user can select manually */ }
  }

  function set(k: keyof FormData, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors?.[k]) setErrors((e) => (e ? { ...e, [k]: undefined } : null));
  }

  function hasErr(k: keyof FormData) { return !!errors?.[k]?.[0]; }
  function errMsg(k: keyof FormData) {
    return errors?.[k]?.[0]
      ? <p className="mt-1 text-[11px] font-medium text-red-500">{errors[k]![0]}</p>
      : null;
  }

  function close() {
    setForm(DEFAULT);
    setErrors(null);
    setInvite(null);
    setCopied(false);
    onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors(null);
    setSubmit(true);
    try {
      const res = await fetch("/api/drivers", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 422 && data.details) { setErrors(data.details); return; }
        toast.error(data.error ?? "Failed to add driver");
        return;
      }
      onCreated(data as DriverRow);
      setInvite({ link: (data as { inviteLink?: string }).inviteLink ?? "", name: (data as DriverRow).name ?? "the driver" });
      toast.success("Driver added — invite sent by SMS");
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSubmit(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())}>
      <DialogContent className="max-w-[460px] p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-6 pb-5 border-b bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cf-primary shadow-sm">
              <IconUserPlus className="h-5 w-5 text-white" stroke={2} />
            </div>
            <div>
              <DialogTitle className="font-heading text-xl font-bold text-slate-800 leading-tight">
                {d.title}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-slate-500 mt-0.5">
                {d.subtitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {invite ? (
          <div className="px-6 py-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15">
                <IconCircleCheck className="h-6 w-6 text-green-600" stroke={2} />
              </div>
              <h3 className="font-heading text-base font-bold text-slate-800">
                {invite.name} {lang === "sw" ? "amealikwa" : "invited"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {lang === "sw"
                  ? "Ujumbe mfupi (SMS) wenye kiungo umetumwa. Unaweza pia kumtumia wewe mwenyewe:"
                  : "An SMS with the invite link was sent to their phone. You can also share it manually:"}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <IconLink className="h-4 w-4 shrink-0 text-slate-400" stroke={2} />
              <input
                readOnly
                value={invite.link}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 bg-transparent text-xs text-slate-600 outline-none"
              />
              <button
                type="button"
                onClick={copyLink}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors",
                  copied ? "bg-green-100 text-green-700" : "bg-cf-primary text-white hover:bg-cf-primary/90",
                )}
              >
                {copied 
                  ? <><IconCircleCheck className="h-3.5 w-3.5" stroke={2.5} /> {t.drivers.card.copied}</> 
                  : <><IconCopy className="h-3.5 w-3.5" stroke={2} /> {lang === "sw" ? "Nakili" : "Copy"}</>}
              </button>
            </div>

            <Button
              onClick={close}
              className="mt-5 w-full bg-cf-primary hover:bg-cf-primary/90 text-white h-10 font-semibold shadow-sm"
            >
              {lang === "sw" ? "Tayari" : "Done"}
            </Button>
          </div>
        ) : (
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {/* Name */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{d.fullName}</label>
              <div className="relative mt-1.5">
                <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  placeholder={d.namePlaceholder}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={cn(inputBase, hasErr("name") ? inputErr : inputNormal)}
                />
              </div>
              {errMsg("name")}
            </div>

            {/* Phone */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{d.phone}</label>
              <div className="relative mt-1.5">
                <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  placeholder="+255 7XX XXX XXX"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={cn(inputBase, hasErr("phone") ? inputErr : inputNormal)}
                />
              </div>
              {errMsg("phone")}
            </div>

            {/* Email */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{d.email}</label>
              <div className="relative mt-1.5">
                <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  placeholder={d.emailPlaceholder}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={cn(inputBase, hasErr("email") ? inputErr : inputNormal)}
                />
              </div>
              {errMsg("email")}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={close}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <IconX className="h-4 w-4" />
              {d.cancel}
            </button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-cf-primary hover:bg-cf-primary/90 text-white h-10 px-6 font-semibold shadow-sm"
            >
              {submitting ? (lang === "sw" ? "Inaongeza..." : "Adding…") : (
                <>
                  {d.addBtn}
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
